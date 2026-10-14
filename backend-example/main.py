"""FastAPI backend with registration, login sessions, and per-user items.

Development run:
    python3 -m venv .venv
    source .venv/bin/activate
    python -m pip install -r requirements.txt
    export SESSION_SECRET="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
    python -m uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from starlette.middleware.sessions import SessionMiddleware

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "app.db")))
SESSION_SECRET = os.getenv("SESSION_SECRET")
if not SESSION_SECRET:
    # Convenient for local development only. Set SESSION_SECRET in deployment.
    SESSION_SECRET = secrets.token_urlsafe(48)
    print("WARNING: SESSION_SECRET is temporary. Set SESSION_SECRET in your shell for stable sessions.")

app = FastAPI(title="Items Manager API", version="2.0.0")
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="items_session",
    same_site="lax",
    https_only=os.getenv("COOKIE_HTTPS_ONLY", "false").lower() == "true",
    max_age=60 * 60 * 24 * 7,
)
# Vite proxies /api requests to this server during local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def database():
    conn = connect_db()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with database() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")
        db.execute("""CREATE TABLE IF NOT EXISTS items (
            id INTEGER NOT NULL,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            price REAL NOT NULL CHECK(price >= 0),
            PRIMARY KEY (user_id, id)
        )""")


init_db()


# PBKDF2 is available in Python's standard library; passwords are never stored as plain text.
def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600_000)
    return f"pbkdf2_sha256$600000${salt.hex()}${derived.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, rounds, salt_hex, expected_hex = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(rounds))
        return hmac.compare_digest(actual.hex(), expected_hex)
    except (ValueError, TypeError):
        return False


class RegisterBody(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=10, max_length=128)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Name must contain at least 2 characters")
        return value

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: str) -> str:
        value = value.strip().lower()
        if value.count("@") != 1 or "." not in value.rsplit("@", 1)[-1]:
            raise ValueError("Enter a valid email address")
        return value


class LoginBody(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: str) -> str:
        return value.strip().lower()


class Item(BaseModel):
    id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=120)
    price: float = Field(ge=0, le=1_000_000_000)

    @field_validator("name")
    @classmethod
    def clean_item_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Item name cannot be blank")
        return value


def current_user(request: Request):
    user_id = request.session.get("user_id")
    if not isinstance(user_id, int):
        raise HTTPException(status_code=401, detail="Please sign in to continue.")
    with database() as db:
        user = db.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,)).fetchone()
    if user is None:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    return dict(user)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterBody, request: Request):
    with database() as db:
        existing = db.execute("SELECT id FROM users WHERE email = ?", (body.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        cursor = db.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (body.name, body.email, hash_password(body.password)),
        )
        user_id = cursor.lastrowid
        # Give each new account its own starter items; they are not shared with other users.
        starter_items = [
            (1, user_id, "Mechanical Keyboard", 4999.0),
            (2, user_id, "Wireless Mouse", 1299.5),
            (3, user_id, "27-inch Monitor", 17999.0),
        ]
        db.executemany("INSERT INTO items (id, user_id, name, price) VALUES (?, ?, ?, ?)", starter_items)
    request.session.clear()
    request.session["user_id"] = user_id
    return {"user": {"id": user_id, "name": body.name, "email": body.email}, "message": "Account created successfully."}


@app.post("/auth/login")
def login(body: LoginBody, request: Request):
    with database() as db:
        user = db.execute("SELECT id, name, email, password_hash FROM users WHERE email = ?", (body.email,)).fetchone()
    # Use the same public error for unknown email and incorrect password.
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    request.session.clear()
    request.session["user_id"] = user["id"]
    return {"user": {"id": user["id"], "name": user["name"], "email": user["email"]}, "message": "Signed in successfully."}


@app.get("/auth/me")
def me(request: Request):
    return {"user": current_user(request)}


@app.post("/auth/logout")
def logout(request: Request, response: Response):
    request.session.clear()
    return {"message": "Signed out successfully."}


@app.get("/items", response_model=list[Item])
def list_items(request: Request, q: Optional[str] = None):
    user = current_user(request)
    with database() as db:
        if q:
            needle = f"%{q.strip()}%"
            rows = db.execute(
                "SELECT id, name, price FROM items WHERE user_id = ? AND (name LIKE ? OR CAST(id AS TEXT) = ?) ORDER BY id",
                (user["id"], needle, q.strip()),
            ).fetchall()
        else:
            rows = db.execute("SELECT id, name, price FROM items WHERE user_id = ? ORDER BY id", (user["id"],)).fetchall()
    return [dict(row) for row in rows]


@app.post("/items", response_model=Item, status_code=201)
def create_item(item: Item, request: Request):
    user = current_user(request)
    with database() as db:
        exists = db.execute("SELECT 1 FROM items WHERE user_id = ? AND id = ?", (user["id"], item.id)).fetchone()
        if exists:
            raise HTTPException(409, f"You already have an item with ID {item.id}.")
        db.execute("INSERT INTO items (id, user_id, name, price) VALUES (?, ?, ?, ?)", (item.id, user["id"], item.name, item.price))
    return item


@app.put("/items/{item_id}", response_model=Item)
def update_item(item_id: int, item: Item, request: Request):
    user = current_user(request)
    with database() as db:
        exists = db.execute("SELECT 1 FROM items WHERE user_id = ? AND id = ?", (user["id"], item_id)).fetchone()
        if not exists:
            raise HTTPException(404, "Item not found in your account.")
        if item.id != item_id and db.execute("SELECT 1 FROM items WHERE user_id = ? AND id = ?", (user["id"], item.id)).fetchone():
            raise HTTPException(409, f"You already have an item with ID {item.id}.")
        db.execute("DELETE FROM items WHERE user_id = ? AND id = ?", (user["id"], item_id))
        db.execute("INSERT INTO items (id, user_id, name, price) VALUES (?, ?, ?, ?)", (item.id, user["id"], item.name, item.price))
    return item


@app.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, request: Request):
    user = current_user(request)
    with database() as db:
        cursor = db.execute("DELETE FROM items WHERE user_id = ? AND id = ?", (user["id"], item_id))
        if cursor.rowcount == 0:
            raise HTTPException(404, "Item not found in your account.")
    return Response(status_code=204)

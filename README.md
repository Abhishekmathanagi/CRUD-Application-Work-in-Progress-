# Items Manager — React + FastAPI Authentication

This version adds account registration, login, logout, signed session cookies, SQLite storage, hashed passwords, and per-user item access while keeping the existing Items Manager theme and interface.

## Requirements

- Python 3.9 or newer (Python 3.10+ is recommended)
- Node.js 20.19+ and npm

## 1. Run the backend (Terminal 1)

```bash
cd backend-example
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
export SESSION_SECRET="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
python -m uvicorn main:app --reload --port 8000
```

Keep this terminal running. The local SQLite database (`app.db`) is created automatically beside `main.py`.

## 2. Run the frontend (Terminal 2)

From the `items-frontend` folder (the folder that contains `package.json`):

```bash
npm install
npm run dev
```

Open the URL Vite prints, normally http://localhost:5173. Do not open the HTML file directly; use the Vite server so API requests are proxied to FastAPI.

## Features

- Create account with name, email, and password (10+ characters).
- Duplicate email addresses are rejected.
- Passwords are stored as salted PBKDF2-HMAC-SHA256 hashes, not plain text.
- Login errors do not reveal whether an email exists.
- Session cookie keeps a user signed in; logout clears the session.
- Every item API route requires login and filters by the signed-in user's ID. Users cannot read, update, or delete another account's items by changing an item ID.
- Each new account receives its own sample items.
- Data persists in SQLite across restarts.

## API routes

- `POST /auth/register` — `{ "name": "Example User", "email": "user@example.com", "password": "at-least-10-characters" }`
- `POST /auth/login` — `{ "email": "user@example.com", "password": "..." }`
- `GET /auth/me` — current session user
- `POST /auth/logout` — clear current session
- `GET/POST/PUT/DELETE /items...` — authenticated, user-scoped item management
- `GET /docs` — interactive API documentation

## Security notes

This is a learning project, not a production-ready identity service. Before deployment, use HTTPS and set `COOKIE_HTTPS_ONLY=true`, keep `SESSION_SECRET` in your deployment secret manager, add CSRF protection for cookie-authenticated state-changing requests, rate-limit registration/login, and add email verification and a password-reset flow. Never commit secrets or your generated `app.db` file to a public repository.

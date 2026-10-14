# Items Manager — Full-Stack Authentication & CRUD Application

A secure, full-stack task and item management application featuring a React frontend and a FastAPI backend. This project implements robust authentication with signed session cookies, password hashing, SQLite persistence, and per-user item isolation.

---

## Features

### Security & Authentication
* **Account Registration & Login:** Create accounts with a name, email, and secure password (minimum 10 characters). Duplicate email addresses are strictly rejected.
* **Salted Password Hashing:** Passwords are securely hashed using PBKDF2-HMAC-SHA256 and are never stored in plain text.
* **Secure Session Management:** Authenticated users receive a signed session cookie. Login error messages are generalized to prevent user enumeration.
* **Per-User Data Isolation:** Every item API route requires authentication and filters strictly by the signed-in user ID, preventing users from accessing, modifying, or deleting another user's items.

### Frontend & Backend Architecture
* **React Frontend:** Built with modern React and Vite for a seamless user experience, with API requests proxied cleanly through the development server.
* **FastAPI Backend:** High-performance, asynchronous Python backend utilizing SQLite for persistent local storage.
* **Sample Data:** Each newly registered account is automatically provisioned with its own sample items to get started immediately.

---

## Project Structure

* **`backend-example/`** — FastAPI backend server
  * `main.py` — Application entry point & API routes
  * `requirements.txt` — Python dependencies
  * `app.db` — SQLite database (auto-generated, git-ignored)
* **`public/`** — Static frontend assets
* **`src/`** — React frontend source code
  * `App.jsx` — Main application component
* **`.env.example`** — Environment variable template
* **`.gitignore`** — Git ignore rules (protects secrets & database)
* **`index.html`** — HTML root template
* **`package.json`** — Node.js dependencies & scripts
* **`vite.config.js`** — Vite configuration & API proxy settings

---

## Getting Started & Local Workflow

### Prerequisites
* **Python** 3.9 or newer (Python 3.10+ recommended)
* **Node.js** 20.19+ and **npm**

### Step 1: Clone and Navigate to the Repository
```bash
git clone [https://github.com/YOUR-USERNAME/crud-application.git](https://github.com/YOUR-USERNAME/crud-application.git)
cd crud-application
Step 2: Run the Backend (Terminal 1)
Open your first terminal and navigate to the backend directory to set up the Python environment:

Bash
cd backend-example

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
python -m pip install -r requirements.txt

# Generate a secure session secret and start the server
export SESSION_SECRET="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
python -m uvicorn main:app --reload --port 8000
Keep this terminal running. The SQLite database (app.db) will generate automatically beside main.py.

Step 3: Run the Frontend (Terminal 2)
Open a second terminal in the project root directory (where package.json is located):

Bash
# Install frontend packages
npm install

# Start the Vite development server
npm run dev
Open the local URL provided by Vite (typically http://localhost:5173) in your browser. The Vite development server will automatically proxy API requests to your FastAPI backend running on port 8000.

API Documentation
While the backend is running, you can explore and test all API endpoints interactively using FastAPI's built-in Swagger documentation:

URL: http://localhost:8000/docs

Core Endpoints:
POST /auth/register — Register a new user account.

POST /auth/login — Authenticate and issue a session cookie.

GET /auth/me — Retrieve the currently signed-in user session.

POST /auth/logout — Clear the current user session.

GET / POST / PUT / DELETE /items... — User-scoped CRUD operations for managing items.

Detailed Workflow
User Authentication:

A user registers via the frontend form. Data is sent to /auth/register, where the backend validates the email, enforces the 10-character password rule, hashes the password securely, and saves it to SQLite (app.db).

Upon logging in (/auth/login), a signed session cookie is securely set in the browser.

State & Session Handling:

Subsequent actions (like fetching or creating items) call /items. The backend inspects the session cookie via /auth/me to verify identity and isolate data specifically to that user ID.

Development Workflow:

Frontend changes hot-reload instantly via Vite.

Backend changes auto-reload via Uvicorn's --reload flag.

Security Notes
This is a learning project designed to demonstrate full-stack architecture and authentication fundamentals, not a production-ready identity provider.

Before Production Deployment:

Enable HTTPS and set COOKIE_HTTPS_ONLY=true.

Store SESSION_SECRET securely in an environment secret manager.

Implement CSRF protection for cookie-authenticated state-changing requests.

Add rate limiting for registration/login endpoints alongside email verification flows.

Important: Never commit sensitive configuration files (.env), database files (app.db), or virtual environments (.venv/, node_modules/) to public repositories.

License
Distributed under the MIT License. See LICENSE for more information.

import { useState } from "react";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (isRegister && name.trim().length < 2) {
      setError("Please enter your name (at least 2 characters).");
      return;
    }
    if (password.length < (isRegister ? 10 : 1)) {
      setError(isRegister ? "Use a password with at least 10 characters." : "Enter your password.");
      return;
    }

    setBusy(true);
    try {
      const user = await onLogin(isRegister
        ? { mode, name: name.trim(), email: email.trim(), password }
        : { mode, email: email.trim(), password });
      if (user) setPassword("");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand-mark" aria-hidden="true">IM</div>
        <p className="login-eyebrow">ITEMS MANAGER</p>
        <h1 id="login-title">{isRegister ? "Create your account" : "Sign in to your account"}</h1>
        <p className="login-description">
          {isRegister ? "Join to manage your own items workspace." : "Welcome back. Your workspace is waiting."}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegister && <>
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={80}
              required
            />
          </>}

          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <div className="login-password-heading">
            <label htmlFor="login-password">Password</label>
            {isRegister && <span className="login-hint">10+ characters</span>}
          </div>
          <div className="login-password-field">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={isRegister ? "Create a strong password" : "Enter your password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isRegister ? 10 : 1}
              maxLength={128}
              required
            />
            <button
              className="login-show-password"
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >{showPassword ? "Hide" : "Show"}</button>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
            {!busy && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <p className="login-footer">
          {isRegister ? "Already have an account? " : "New here? "}
          <button type="button" className="login-text-button" onClick={() => changeMode(isRegister ? "login" : "register")}>
            {isRegister ? "Sign in" : "Create an account"}
          </button>
        </p>
        <p className="login-demo-note">Secure password hashing · Separate workspace for each account</p>
      </section>
    </main>
  );
}

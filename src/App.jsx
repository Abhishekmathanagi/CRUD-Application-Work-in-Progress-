import { useCallback, useEffect, useState } from "react";

import Login from "./components/Login";
import AddItemForm from "./components/AddItemForm";
import ItemsTable from "./components/ItemsTable";
import SearchToggle from "./components/SearchToggle";

import { useDebounce } from "./hooks/useDebounce";
import { useItems } from "./hooks/useItems";
import { api } from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [searchEnabled, setSearchEnabled] = useState(false);
  const [query, setQuery] = useState("");

  // Restore the user's session when the application starts.
  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const result = await api.me();

        if (active) {
          setUser(result.user ?? null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  // Register a new account or log in to an existing account.
  const handleAuth = useCallback(async (details) => {
    setAuthError("");

    try {
      const result =
        details.mode === "register"
          ? await api.register({
              name: details.name.trim(),
              email: details.email.trim(),
              password: details.password,
            })
          : await api.login({
              email: details.email.trim(),
              password: details.password,
            });

      if (!result?.user) {
        throw new Error("The server did not return a user account.");
      }

      setUser(result.user);
      setSearchEnabled(false);
      setQuery("");
      setLogoutError("");

      return result.user;
    } catch (error) {
      setAuthError(
        error.message || "Authentication failed. Please try again."
      );

      // Let Login handle the rejected request as well, if it supports it.
      throw error;
    }
  }, []);

  // End the session.
  const handleLogout = useCallback(async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      await api.logout();

      setUser(null);
      setSearchEnabled(false);
      setQuery("");
      setAuthError("");
    } catch (error) {
      setLogoutError(
        error.message ||
          "Could not sign out. Check your connection and try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }, [loggingOut]);

  // Only send a search query when search is enabled.
  const debouncedQuery = useDebounce(
    searchEnabled ? query.trim() : "",
    300
  );

  const {
    items,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
  } = useItems(debouncedQuery, Boolean(user));

  const handleToggle = useCallback((enabled) => {
    setSearchEnabled(enabled);

    if (!enabled) {
      setQuery("");
    }
  }, []);

  if (authLoading) {
    return (
      <main className="login-page">
        <section className="login-card" aria-live="polite">
          <p className="login-description">Checking your session…</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLogin={handleAuth} error={authError} />
      </>
    );
  }

  return (
    <main className="container">
      <header>
        <h1>Items Manager</h1>

        <p className="subtitle">
          FastAPI + React · Your private items workspace
        </p>

        <div className="signed-in-bar">
          <span>
            Signed in as{" "}
            <strong>
              {user.name} ({user.email})
            </strong>
          </span>

          <button
            className="btn"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>

        {logoutError && (
          <div className="banner" role="alert">
            {logoutError}
          </div>
        )}
      </header>

      <SearchToggle
        enabled={searchEnabled}
        onToggle={handleToggle}
        query={query}
        onQueryChange={setQuery}
      />

      <AddItemForm onAdd={addItem} />

      {error && (
        <div className="banner" role="alert">
          Could not load your items: {error}
        </div>
      )}

      <ItemsTable
        items={items}
        loading={loading}
        onSave={updateItem}
        onDelete={removeItem}
      />
    </main>
  );
}
import React, { useEffect, useState } from "react";

export default function MerchantAccess({ children }) {
  const [user, setUser] = useState(null),
    [loaded, setLoaded] = useState(false),
    [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (r.ok) setUser(await r.json());
        else if (r.status !== 401)
          throw Error("Your workspace could not be loaded.");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true));
  }, []);
  if (!loaded)
    return (
      <div className="auth-loading">
        MYVERSE <span>Opening your world…</span>
      </div>
    );
  if (user)
    return children(user, async () => {
      try {
        const r = await fetch("/api/auth/logout", { method: "POST" });
        if (!r.ok) throw Error("Could not sign out.");
        setRegister(false);
        setError("");
        setUser(null);
      } catch (e) {
        setError(e.message);
      }
    });
  return (
    <main className="merchant-access">
      <section className="auth-story">
        <a href="/" className="auth-wordmark">
          MYVERSE<span>COMMERCE FOR CONSIDERED LIVING</span>
        </a>
        <div className="auth-story-copy">
          <span className="light-eyebrow">A WORLD, ENTIRELY YOUR OWN.</span>
          <h1>
            Extraordinary spaces.
            <br />
            <em>Independent vision.</em>
          </h1>
          <p>
            The home of your next collection. Build a distinctive interior
            brand, curate exceptional objects, and bring your world to life.
          </p>
          <a href="/store/myverse-atelier">
            Explore the Myverse collection <span>↗</span>
          </a>
        </div>
        <div className="auth-architecture">
          <div className="arch-panel" />
          <div className="stone-plinth" />
          <div className="sculpture-ring" />
        </div>
        <span className="auth-footnote">
          INTERIORS. OBJECTS. YOUR UNIVERSE.
        </span>
      </section>
      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <span className="eyebrow">YOUR PRIVATE WORKSPACE</span>
          <h2>
            {register ? "Make room for your vision." : "Welcome to your world."}
          </h2>
          <p>
            {register
              ? "Create your merchant account to begin."
              : "Sign in to curate, create, and grow your brand."}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const data = Object.fromEntries(new FormData(e.currentTarget));
                const response = await fetch(
                  `/api/auth/${register ? "register" : "login"}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  },
                );
                const result = await response.json();
                if (!response.ok) throw Error(result.error);
                setUser(result);
              } catch (err) {
                setError(err.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {register && (
              <label>
                Your name
                <input
                  name="name"
                  required
                  maxLength="80"
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                required
                maxLength="254"
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                minLength="10"
                maxLength="256"
                autoComplete={register ? "new-password" : "current-password"}
              />
              {register && <small>Use at least 10 characters.</small>}
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={busy}>
              {busy
                ? "Opening your workspace…"
                : register
                  ? "Create merchant account"
                  : "Sign in"}
              <span>→</span>
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have a workspace?" : "New to Myverse?"}{" "}
            <button
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </p>
          <div className="auth-assurance">
            A private account. Your own catalogs, branding, and orders.
          </div>
        </div>
        <footer>
          MYVERSE <span>Luxury is personal.</span>
        </footer>
      </section>
    </main>
  );
}

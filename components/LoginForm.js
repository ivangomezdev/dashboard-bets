"use client";

import { useState } from "react";

export default function LoginForm({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    setLoading(false);

    if (!response.ok) {
      setError("La clave no coincide.");
      return;
    }

    onSuccess();
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div>
          <span className="eyebrow">Acceso privado</span>
          <h1>Arbs resueltos</h1>
          <p>Resumen diario de ganancia y pérdida tomado del archivo local de cierre.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="password">Clave</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" disabled={loading || !password}>
            {loading ? "Validando" : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Dashboard from "@/components/Dashboard";
import LoginForm from "@/components/LoginForm";

export default function Home() {
  const [authState, setAuthState] = useState("checking");

  useEffect(() => {
    fetch("/api/arbs", { cache: "no-store" })
      .then((response) => {
        setAuthState(response.ok ? "authed" : "guest");
      })
      .catch(() => setAuthState("guest"));
  }, []);

  if (authState === "checking") {
    return (
      <main className="loading-shell">
        <div className="loading-panel">
          <span className="loading-kicker">Arbs</span>
          <h1>Cargando panel</h1>
        </div>
      </main>
    );
  }

  if (authState === "guest") {
    return <LoginForm onSuccess={() => setAuthState("authed")} />;
  }

  return <Dashboard onLogout={() => setAuthState("guest")} />;
}

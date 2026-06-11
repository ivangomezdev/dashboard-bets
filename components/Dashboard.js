"use client";

import { useEffect, useMemo, useState } from "react";
import ArbsTable from "@/components/ArbsTable";
import BookersPanel from "@/components/BookersPanel";
import DailyChart from "@/components/DailyChart";
import Filters from "@/components/Filters";
import StatCard from "@/components/StatCard";
import { formatMoney } from "@/lib/format";

export default function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    outcome: "all",
    booker: "all",
    date: "all"
  });

  async function loadData() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/arbs", { cache: "no-store" });

    if (!response.ok) {
      setError("No se pudo leer el dashboard.");
      setLoading(false);
      return;
    }

    const payload = await response.json();
    setData(payload.data);
    setLoading(false);
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    onLogout();
  }

  useEffect(() => {
    loadData();
  }, []);

  const filterOptions = useMemo(() => {
    if (!data) {
      return { dates: [], bookers: [] };
    }

    const dates = data.daily.map((day) => day.date).reverse();
    const bookers = Array.from(
      new Set(data.arbs.flatMap((arb) => arb.legs.map((leg) => leg.booker)))
    ).sort((a, b) => a.localeCompare(b));

    return { dates, bookers };
  }, [data]);

  const filteredArbs = useMemo(() => {
    if (!data) {
      return [];
    }

    const search = filters.search.trim().toLowerCase();

    return data.arbs.filter((arb) => {
      const matchesSearch =
        !search ||
        [arb.event, arb.market, arb.winningBooker, arb.id].some((value) =>
          String(value || "").toLowerCase().includes(search)
        );
      const matchesOutcome =
        filters.outcome === "all" ||
        (filters.outcome === "profit" && arb.profitMxn >= 0) ||
        (filters.outcome === "loss" && arb.profitMxn < 0);
      const matchesBooker =
        filters.booker === "all" || arb.legs.some((leg) => leg.booker === filters.booker);
      const matchesDate = filters.date === "all" || arb.dateKey === filters.date;

      return matchesSearch && matchesOutcome && matchesBooker && matchesDate;
    });
  }, [data, filters]);

  if (loading) {
    return (
      <main className="loading-shell">
        <div className="loading-panel">
          <span className="loading-kicker">Arbs</span>
          <h1>Actualizando datos</h1>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="error-shell">
        <section className="error-panel">
          <span className="eyebrow">Archivo local</span>
          <h1>{error}</h1>
          <button onClick={loadData}>Reintentar</button>
        </section>
      </main>
    );
  }

  const totals = data.totals;
  const lastDay = data.daily[data.daily.length - 1];

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Closed arbs</span>
          <h1>Resumen de resultados</h1>
        </div>
        <div className="topbar-actions">
          <button className="secondary-button" onClick={loadData}>Actualizar</button>
          <button className="ghost-button" onClick={handleLogout}>Salir</button>
        </div>
      </header>

      <section className="stats-grid" aria-label="Metricas principales">
        <StatCard label="Ganancia neta" value={formatMoney(totals.totalProfitMxn)} tone={totals.totalProfitMxn >= 0 ? "good" : "bad"} />
        <StatCard label="Resultado USD" value={formatMoney(totals.totalProfitUsd, "USD")} tone={totals.totalProfitUsd >= 0 ? "good" : "bad"} />
        <StatCard label="Arbs resueltos" value={totals.totalArbs} detail={`${totals.positive} positivos · ${totals.negative} negativos`} />
        <StatCard label="Dia mas reciente" value={lastDay ? formatMoney(lastDay.profitMxn) : "$0.00"} detail={lastDay ? `${lastDay.date} · ${lastDay.count} arbs` : "Sin datos"} tone={lastDay?.profitMxn >= 0 ? "good" : "bad"} />
      </section>

      <section className="insight-grid">
        <DailyChart daily={data.daily} />
        <BookersPanel bookers={data.bookers} />
      </section>

      <section className="table-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Detalle</span>
            <h2>Arbs resueltos</h2>
          </div>
          <span className="result-count">{filteredArbs.length} visibles</span>
        </div>
        <Filters filters={filters} onChange={setFilters} options={filterOptions} />
        <ArbsTable arbs={filteredArbs} />
      </section>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import ArbsTable from "@/components/ArbsTable";
import BookersPanel from "@/components/BookersPanel";
import ClientsSection from "@/components/ClientsSection";
import DailyChart from "@/components/DailyChart";
import Filters from "@/components/Filters";
import StatCard from "@/components/StatCard";
import TotalizedSection from "@/components/TotalizedSection";
import WithdrawalsSection from "@/components/WithdrawalsSection";
import { ACTIVE_CLIENT_COUNT, CLIENT_ACCOUNTS } from "@/lib/clientAccounts";
import { formatMoney, formatMxnAsUsd } from "@/lib/format";
import { WITHDRAWALS } from "@/lib/withdrawals";

const CURRENT_BALANCE_USD = CLIENT_ACCOUNTS.reduce(
  (sum, account) => sum + Number(account.balance || 0),
  0
);

function withoutUsdCode(value) {
  return String(value).trim().replace(/^(-?)USD\s*/i, "$1$");
}

function formatCompactMxn(value) {
  const amount = Number(value || 0);

  if (Math.abs(amount) >= 1000000) {
    return `${(Math.trunc(amount / 100000) / 10).toFixed(1)}M`;
  }

  return formatMoney(amount);
}

export default function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("summary");
  const [filters, setFilters] = useState({
    search: "",
    outcome: "all",
    booker: "all",
    vps: "all",
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
      return { dates: [], bookers: [], vpses: [] };
    }

    const dates = data.daily.map((day) => day.date).reverse();
    const bookers = Array.from(
      new Set(data.arbs.flatMap((arb) => arb.legs.map((leg) => leg.bookerKey || leg.booker)))
    ).sort((a, b) => a.localeCompare(b));
    const vpses = Array.from(
      new Set(data.arbs.flatMap((arb) => arb.legs.map((leg) => leg.vps).filter(Boolean)))
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return { dates, bookers, vpses };
  }, [data]);

  const filteredArbs = useMemo(() => {
    if (!data) {
      return [];
    }

    const search = filters.search.trim().toLowerCase();

    return data.arbs.filter((arb) => {
      const matchesSearch =
        !search ||
        [
          arb.event,
          arb.market,
          arb.winningBooker,
          arb.id,
          ...arb.legs.flatMap((leg) => [leg.booker, leg.bookerLabel, leg.vps])
        ].some((value) =>
          String(value || "").toLowerCase().includes(search)
        );
      const matchesOutcome =
        filters.outcome === "all" ||
        (filters.outcome === "profit" && arb.profitMxn >= 0) ||
        (filters.outcome === "loss" && arb.profitMxn < 0);
      const matchesBooker =
        filters.booker === "all" ||
        arb.legs.some((leg) => (leg.bookerKey || leg.booker) === filters.booker);
      const matchesVps =
        filters.vps === "all" || arb.legs.some((leg) => leg.vps === filters.vps);
      const matchesDate = filters.date === "all" || arb.dateKey === filters.date;

      return matchesSearch && matchesOutcome && matchesBooker && matchesVps && matchesDate;
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
  const viewTitle =
    activeView === "clients"
      ? { eyebrow: "Control de cuentas", heading: "Clientes" }
      : activeView === "totalized"
        ? { eyebrow: "Resultados consolidados", heading: "Totalizado" }
      : activeView === "withdrawals"
        ? { eyebrow: "Movimientos", heading: "Retiros" }
        : { eyebrow: "Closed arbs", heading: "Resumen de resultados" };

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">{viewTitle.eyebrow}</span>
          <h1>{viewTitle.heading}</h1>
        </div>
        <div className="topbar-actions">
          <nav className="view-nav" aria-label="Secciones del dashboard">
            <button
              aria-current={activeView === "summary" ? "page" : undefined}
              className={activeView === "summary" ? "is-active" : ""}
              onClick={() => setActiveView("summary")}
              type="button"
            >
              Resumen
            </button>
            <button
              aria-current={activeView === "clients" ? "page" : undefined}
              className={activeView === "clients" ? "is-active" : ""}
              onClick={() => setActiveView("clients")}
              type="button"
            >
              Clientes
            </button>
            <button
              aria-current={activeView === "totalized" ? "page" : undefined}
              className={activeView === "totalized" ? "is-active" : ""}
              onClick={() => setActiveView("totalized")}
              type="button"
            >
              Totalizado
            </button>
            <button
              aria-current={activeView === "withdrawals" ? "page" : undefined}
              className={activeView === "withdrawals" ? "is-active" : ""}
              onClick={() => setActiveView("withdrawals")}
              type="button"
            >
              Retiros
            </button>
          </nav>
          <button className="secondary-button" onClick={loadData}>Actualizar</button>
          <button className="ghost-button" onClick={handleLogout}>Salir</button>
        </div>
      </header>

      {activeView === "clients" ? (
        <ClientsSection accounts={CLIENT_ACCOUNTS} arbs={data.arbs} />
      ) : activeView === "totalized" ? (
        <TotalizedSection accounts={CLIENT_ACCOUNTS} arbs={data.arbs} />
      ) : activeView === "withdrawals" ? (
        <WithdrawalsSection withdrawals={WITHDRAWALS} />
      ) : (
        <>
      <section className="stats-grid" aria-label="Metricas principales">
        <StatCard
          label="Saldo actual"
          value={withoutUsdCode(formatMoney(CURRENT_BALANCE_USD, "USD"))}
          detail="Total disponible"
          tone="good"
        />
        <StatCard label="Stake total" value={formatCompactMxn(totals.totalStakeMxn)} detail="Apostado total" />
        <StatCard label="Arbs resueltos" value={totals.totalArbs} detail={`${totals.positive} positivos - ${totals.negative} negativos`} />
        <StatCard label="Dia mas reciente" value={lastDay ? formatMxnAsUsd(lastDay.profitMxn) : "$0.00"} detail={lastDay ? `${lastDay.date} - ${lastDay.count} arbs` : "Sin datos"} tone={lastDay?.profitMxn >= 0 ? "good" : "bad"} />
        <button className="stat-card clients-card" type="button" onClick={() => setActiveView("clients")}>
          <span>Clientes disponibles</span>
          <strong>{ACTIVE_CLIENT_COUNT}</strong>
          <small>Ver cuentas, VPS y saldos</small>
        </button>
      </section>

      <section className="insight-grid">
        <div className="chart-column">
          <DailyChart daily={data.daily} />
          <section className="work-panel">
            <span className="eyebrow">Roadmap</span>
            <h2>CONFIGURANDO VPS Y CARGANDO CUENTAS</h2>
            <p>
              <strong>21/08 · Implementación de socket</strong><br />
              Incidencia detectada: Polymarket no colocó la apuesta de Tigres–Atlante durante la implementación.
            </p>
          </section>
        </div>
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
        </>
      )}
    </main>
  );
}

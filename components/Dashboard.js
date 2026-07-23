"use client";

import { useEffect, useMemo, useState } from "react";
import ArbsTable from "@/components/ArbsTable";
import BookersPanel from "@/components/BookersPanel";
import DailyChart from "@/components/DailyChart";
import Filters from "@/components/Filters";
import StatCard from "@/components/StatCard";
import { formatMoney, formatMxnAsUsd } from "@/lib/format";

const CURRENT_BALANCE_USD = 3885;
const AVAILABLE_CLIENTS = [
  { name: "Pinnacle", count: 1 },
  { name: "Bookmakerxyz", count: 2, status: "Inactivo por delay" },
  { name: "Pokerstars", count: 2 },
  { name: "888sport", count: 2 },
  { name: "Kalshi", count: 1 },
  { name: "Polymarket", count: 1 },
  { name: "1xbet", count: 0, status: "Baneado" },
  { name: "1xbit", count: 1 },
  { name: "Shuffle", count: 1 },
  { name: "FortuneJack", count: 1, status: "Inactivo por delay" },
  { name: "Jack", count: 1 },
  { name: "Gamdom", count: 1 },
  { name: "Sportsbetio", count: 1 },
  { name: "BCGame", count: 1 },
  { name: "BetOnline", count: 1 },
  { name: "ArtLineBet", count: 1 }
];
const AVAILABLE_CLIENT_COUNT = AVAILABLE_CLIENTS.reduce(
  (sum, client) => sum + (client.status ? 0 : client.count),
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
  const [showClients, setShowClients] = useState(false);
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
        <StatCard
          label="Saldo actual"
          value={withoutUsdCode(formatMoney(CURRENT_BALANCE_USD, "USD"))}
          detail="Total disponible"
          tone="good"
        />
        <StatCard label="Stake total" value={formatCompactMxn(totals.totalStakeMxn)} detail="Apostado total" />
        <StatCard label="Arbs resueltos" value={totals.totalArbs} detail={`${totals.positive} positivos - ${totals.negative} negativos`} />
        <StatCard label="Dia mas reciente" value={lastDay ? formatMxnAsUsd(lastDay.profitMxn) : "$0.00"} detail={lastDay ? `${lastDay.date} - ${lastDay.count} arbs` : "Sin datos"} tone={lastDay?.profitMxn >= 0 ? "good" : "bad"} />
        <button className="stat-card clients-card" type="button" onClick={() => setShowClients(true)}>
          <span>Clientes disponibles</span>
          <strong>{AVAILABLE_CLIENT_COUNT}</strong>
          <small>Ver detalle por booker</small>
        </button>
      </section>

      {showClients ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowClients(false)}>
          <section
            aria-labelledby="clients-modal-title"
            aria-modal="true"
            className="clients-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Bookers</span>
                <h2 id="clients-modal-title">Clientes disponibles</h2>
              </div>
              <button className="ghost-button" type="button" onClick={() => setShowClients(false)}>
                Cerrar
              </button>
            </div>
            <div className="client-list">
              {AVAILABLE_CLIENTS.map((client) => (
                <div className={`client-row ${client.status ? "inactive" : ""}`} key={client.name}>
                  <span className="client-name">
                    <span>{client.name}</span>
                    {client.status ? <small>{client.status}</small> : null}
                  </span>
                  <b>{client.count}</b>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <section className="insight-grid">
        <div className="chart-column">
          <DailyChart daily={data.daily} />
          <section className="work-panel">
            <span className="eyebrow">Roadmap</span>
            <h2>TENIS LISTO</h2>
            <p>SOLO MARKETS: TOTAL SETS - SETS HANDICAP - 1X2</p>
            <p>Los demás mueven la cuota muy rápido.</p>
            <p>1XBIT AGREGADO</p>
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
    </main>
  );
}

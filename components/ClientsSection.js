"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ArbsTable from "@/components/ArbsTable";
import BookmakerName from "@/components/BookmakerName";

import { accountMatchesLeg, canonicalBooker, getDailyAccountActivity } from "@/lib/accountReporting";

function formatAccountBalance(value, currency) {
  if (value == null) return "Sin saldo registrado";
  const amount = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));

  return `${amount} ${String(currency || "").toUpperCase()}`;
}

function formatSignedUsd(value) {
  const amount = Number(value || 0);
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${formatAccountBalance(Math.abs(amount), "USD")}`;
}

const STATUS_LABELS = {
  BLK: { label: "Bloqueada", className: "is-blocked" },
  OFF: { label: "Desconectada", className: "is-offline" },
  TMP: { label: "Temporal", className: "is-temporary" },
  "PRE MARKET": { label: "Pre market", className: "is-pre-market" },
  "SIN CONFIRMAR": { label: "Sin confirmar", className: "is-neutral" },
  "NO DISPONIBLE": { label: "No disponible", className: "is-neutral" }
};

function formatShortDate(date) {
  const [year, month, day] = String(date || "").split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Sin registro";
}

export default function ClientsSection({ accounts, arbs, daily }) {
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [showHistorical, setShowHistorical] = useState(false);
  const resultsRef = useRef(null);
  const activeCount = accounts.filter((account) => account.status === "ON").length;
  const dates = useMemo(() => Array.from(new Set([
    ...daily.map((day) => day.date),
    ...arbs.map((arb) => arb.placedDateKey)
  ])).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort().reverse(), [arbs, daily]);
  const date = dates.includes(selectedDate) ? selectedDate : dates[0] || "";
  const selectedAccount = accounts.find((account) =>
    account.id === selectedAccountId && (showHistorical || account.status === "ON"));

  const groupedAccounts = useMemo(() => {
    const groups = new Map();

    for (const account of accounts) {
      if (!showHistorical && account.status !== "ON") continue;
      const key = canonicalBooker(account.booker);
      const group = groups.get(key) || { booker: account.booker, accounts: [] };
      group.accounts.push(account);
      groups.set(key, group);
    }

    for (const group of groups.values()) {
      group.accounts.sort((a, b) => a.vps.localeCompare(b.vps, "es", { numeric: true }));
    }
    return Array.from(groups.values()).sort((a, b) =>
      a.booker.localeCompare(b.booker, "es", { numeric: true })
    );
  }, [accounts, showHistorical]);

  const selectedArbs = useMemo(() => {
    if (!selectedAccount) {
      return [];
    }

    return arbs.filter((arb) => !arb.synthetic &&
      arb.legs.some((leg) => leg.outcome !== "missing" && accountMatchesLeg(selectedAccount, leg, accounts))
    );
  }, [accounts, arbs, selectedAccount]);

  const dailyAccountStats = useMemo(() => getDailyAccountActivity(accounts, arbs, date), [accounts, arbs, date]);

  useEffect(() => {
    if (selectedAccountId) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedAccountId]);

  return (
    <section className="clients-section" aria-labelledby="clients-title">
      <div className="clients-overview">
        <div>
          <h2 id="clients-title">{activeCount} cuentas disponibles</h2>
          <p>Las apuestas y la primera colocación se basan en los cierres registrados. El resultado neto de cada arb se reparte entre las cuentas participantes.</p>
        </div>
        <div className="clients-controls">
          <label className="clients-date">
            Fecha de actividad
            <select value={date} onChange={(event) => setSelectedDate(event.target.value)} disabled={!dates.length}>
              {!dates.length && <option value="">Sin fechas registradas</option>}
              {dates.map((day) => <option key={day} value={day}>{formatShortDate(day)}</option>)}
            </select>
          </label>
          <label className="clients-history-toggle">
            <input type="checkbox" checked={showHistorical} onChange={(event) => setShowHistorical(event.target.checked)} />
            Mostrar cuentas no disponibles
          </label>
        </div>
      </div>

      <div className="client-booker-grid">
        {groupedAccounts.map((group) => {
          const groupActiveCount = group.accounts.filter((account) => account.status === "ON").length;

          return (
            <article className="client-booker-card" key={group.booker}>
              <div className="client-booker-heading">
                <BookmakerName name={group.booker} />
                <small>{groupActiveCount} {groupActiveCount === 1 ? "disponible" : "disponibles"}</small>
              </div>
              <div className="client-account-list">
                {group.accounts.map((account) => {
                  const isSelected = account.id === selectedAccountId;
                  const stats = dailyAccountStats.get(account.id);
                  const status = STATUS_LABELS[account.status];
                  const stakeLabel = Array.from(stats.stakes, ([currency, value]) => formatAccountBalance(value, currency)).join(" · ");
                  const resultTone =
                    stats.profitUsd > 0
                      ? "is-profit"
                      : stats.profitUsd < 0
                        ? "is-loss"
                        : "is-neutral";

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`client-account ${status?.className || ""} ${isSelected ? "is-selected" : ""}`}
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      type="button"
                    >
                      <span className="client-account-meta">
                        <span>{account.vps}</span>
                        {status && <span className={`status-badge ${status.className}`}>{status.label}</span>}
                      </span>
                      <span className="client-account-metric">
                        <span>Apostado</span>
                        <b>{stats.placedCount} {stats.placedCount === 1 ? "apuesta" : "apuestas"}{stakeLabel && ` · ${stakeLabel}`}</b>
                      </span>
                      <span className={`client-account-result ${resultTone}`}>
                        <span>Resultado neto</span>
                        <b>{stats.settledCount ? formatSignedUsd(stats.profitUsd) : "Sin cierres"}</b>
                      </span>
                      <span className="client-account-metric">
                        <span>Primera apuesta</span>
                        <b>{formatShortDate(stats.firstPlacedDate)}</b>
                      </span>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <section className="client-arbs-section" aria-live="polite" ref={resultsRef}>
        {selectedAccount ? (
          <>
            <div className="section-heading">
              <div>
                <h2>{selectedAccount.booker} · {selectedAccount.vps}</h2>
              </div>
              <span className="result-count">{selectedArbs.length} arbs encontrados</span>
            </div>
            <ArbsTable arbs={selectedArbs} />
          </>
        ) : (
          <div className="client-selection-prompt">
            <h2>Selecciona una cuenta</h2>
            <p>Consulta el historial de apuestas de esa casa y VPS.</p>
          </div>
        )}
      </section>
    </section>
  );
}

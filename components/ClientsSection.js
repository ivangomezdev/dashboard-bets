"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ArbsTable from "@/components/ArbsTable";
import BookmakerName from "@/components/BookmakerName";

const MXN_PER_USD = 17;

function formatAccountBalance(value, currency) {
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

function normalizeBooker(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeVps(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function matchesBooker(accountBooker, legBooker) {
  const accountKey = normalizeBooker(accountBooker);
  const legKey = normalizeBooker(legBooker);

  return accountKey === legKey || accountKey.includes(legKey) || legKey.includes(accountKey);
}

function formatShortDate(date) {
  const [year, month, day] = String(date || "").split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Sin fecha";
}

function legProfitUsd(leg) {
  const stake = Number(leg.stake || 0);
  const currencyRate = String(leg.currency || "").toUpperCase() === "MXN" ? 1 / MXN_PER_USD : 1;

  if (leg.outcome === "won") {
    const recordedPayout = Number(leg.actualPayout || leg.actualPayoutMxn || 0);
    const estimatedPayout = stake * Number(leg.odds || 0);
    const payout = recordedPayout > 0 ? recordedPayout : estimatedPayout;
    return (payout - stake) * currencyRate;
  }

  if (leg.outcome === "lost") {
    return -stake * currencyRate;
  }

  return 0;
}

export default function ClientsSection({ accounts, arbs }) {
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const resultsRef = useRef(null);
  const activeCount = accounts.filter((account) => account.status === "ON").length;
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || null;
  const latestDate = useMemo(
    () =>
      arbs.reduce(
        (latest, arb) =>
          arb.dateKey !== "Sin fecha" && arb.dateKey > latest ? arb.dateKey : latest,
        ""
      ),
    [arbs]
  );

  const groupedAccounts = useMemo(() => {
    const groups = new Map();

    for (const account of accounts) {
      const key = normalizeBooker(account.booker);
      const group = groups.get(key) || { booker: account.booker, accounts: [] };
      group.accounts.push(account);
      groups.set(key, group);
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.booker.localeCompare(b.booker, "es", { numeric: true })
    );
  }, [accounts]);

  const selectedArbs = useMemo(() => {
    if (!selectedAccount) {
      return [];
    }

    const selectedVps = normalizeVps(selectedAccount.vps);

    return arbs.filter((arb) =>
      arb.legs.some(
        (leg) =>
          normalizeVps(leg.vps) === selectedVps &&
          matchesBooker(selectedAccount.booker, leg.bookerBase || leg.booker)
      )
    );
  }, [arbs, selectedAccount]);

  const lastDayAccountStats = useMemo(() => {
    const stats = new Map();
    const lastDayArbs = arbs.filter((arb) => arb.dateKey === latestDate);

    for (const account of accounts) {
      const selectedVps = normalizeVps(account.vps);
      let count = 0;
      let profitUsd = 0;

      for (const arb of lastDayArbs) {
        const matchingLegs = arb.legs.filter(
          (leg) =>
            normalizeVps(leg.vps) === selectedVps &&
            matchesBooker(account.booker, leg.bookerBase || leg.booker)
        );

        if (matchingLegs.length) {
          count += 1;
          profitUsd += matchingLegs.reduce((sum, leg) => sum + legProfitUsd(leg), 0);
        }
      }

      stats.set(account.id, { count, profitUsd: Number(profitUsd.toFixed(2)) });
    }

    return stats;
  }, [accounts, arbs, latestDate]);

  useEffect(() => {
    if (selectedAccountId) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedAccountId]);

  return (
    <section className="clients-section" aria-labelledby="clients-title">
      <div className="clients-overview">
        <div>
          <span className="eyebrow">Inventario de cuentas</span>
          <h2 id="clients-title">Clientes por bookmaker</h2>
          <p>Selecciona una cuenta para consultar los arbs de ese bookmaker en su VPS.</p>
        </div>
        <div className="clients-totals" aria-label="Resumen de cuentas">
          <span><strong>{accounts.length}</strong> cuentas</span>
          <span className="active-total"><strong>{activeCount}</strong> activas</span>
          <span className="offline-total"><strong>{accounts.length - activeCount}</strong> desconectada</span>
          <span><strong>{formatShortDate(latestDate)}</strong> último día</span>
        </div>
      </div>

      <div className="client-booker-grid">
        {groupedAccounts.map((group) => {
          const groupActiveCount = group.accounts.filter((account) => account.status === "ON").length;

          return (
            <article className="client-booker-card" key={group.booker}>
              <div className="client-booker-heading">
                <BookmakerName name={group.booker} />
                <small>{groupActiveCount}/{group.accounts.length} activas</small>
              </div>
              <div className="client-account-list">
                {group.accounts.map((account) => {
                  const isSelected = account.id === selectedAccountId;
                  const lastDayStats = lastDayAccountStats.get(account.id) || {
                    count: 0,
                    profitUsd: 0
                  };
                  const resultTone =
                    lastDayStats.profitUsd > 0
                      ? "is-profit"
                      : lastDayStats.profitUsd < 0
                        ? "is-loss"
                        : "is-neutral";

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`client-account ${account.status === "OFF" ? "is-offline" : ""} ${isSelected ? "is-selected" : ""}`}
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      type="button"
                    >
                      <span className="client-account-meta">
                        <span>{account.vps}</span>
                        <span className={`status-badge ${account.status === "ON" ? "is-online" : "is-offline"}`}>
                          <i aria-hidden="true" />
                          {account.status}
                        </span>
                      </span>
                      <strong>{formatAccountBalance(account.balance, account.currency)}</strong>
                      <span className="client-account-activity">
                        <b>{lastDayStats.count}</b> arbs · {formatShortDate(latestDate)}
                      </span>
                      <span className={`client-account-result ${resultTone}`}>
                        {lastDayStats.count === 0
                          ? "Sin actividad"
                          : lastDayStats.profitUsd > 0
                          ? "Ganado"
                          : lastDayStats.profitUsd < 0
                            ? "Perdido"
                            : "Sin cambio"}
                        <b>{formatSignedUsd(lastDayStats.profitUsd)}</b>
                      </span>
                      {account.note ? <small>{account.note}</small> : null}
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
                <span className="eyebrow">Historial filtrado</span>
                <h2>{selectedAccount.booker} · {selectedAccount.vps}</h2>
              </div>
              <span className="result-count">{selectedArbs.length} arbs encontrados</span>
            </div>
            <ArbsTable arbs={selectedArbs} />
          </>
        ) : (
          <div className="client-selection-prompt">
            <span className="eyebrow">Historial de arbs</span>
            <h2>Selecciona una cuenta</h2>
            <p>El detalle aparecerá aquí filtrado por bookmaker y VPS.</p>
          </div>
        )}
      </section>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ArbsTable from "@/components/ArbsTable";
import BookmakerName from "@/components/BookmakerName";

const REPORT_START_DATE = "2026-08-06";

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

function accountMatchesLeg(account, leg, accounts) {
  if (!matchesBooker(account.booker, leg.bookerBase || leg.booker)) {
    return false;
  }

  const legVps = normalizeVps(leg.vps);

  if (legVps) {
    return normalizeVps(account.vps) === legVps;
  }

  const bookerAccounts = accounts.filter((candidate) =>
    matchesBooker(candidate.booker, leg.bookerBase || leg.booker)
  );

  if (bookerAccounts.length === 1) {
    return bookerAccounts[0].id === account.id;
  }

  const currencyAccounts = bookerAccounts.filter(
    (candidate) =>
      String(candidate.currency).toUpperCase() === String(leg.currency).toUpperCase()
  );

  return currencyAccounts.length === 1 && currencyAccounts[0].id === account.id;
}

function statusClassName(status) {
  if (status === "ON") {
    return "is-online";
  }

  if (status === "PRE MARKET") {
    return "is-pre-market";
  }

  if (status === "TMP") {
    return "is-temporary";
  }

  if (status === "BLK") {
    return "is-blocked";
  }

  return "is-offline";
}

function formatShortDate(date) {
  const [year, month, day] = String(date || "").split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Sin fecha";
}

function formatPeriod(endDate) {
  return `${formatShortDate(REPORT_START_DATE)} - ${formatShortDate(endDate)}`;
}

export default function ClientsSection({ accounts, arbs }) {
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const resultsRef = useRef(null);
  const activeCount = accounts.filter((account) => account.status === "ON").length;
  const preMarketCount = accounts.filter((account) => account.status === "PRE MARKET").length;
  const temporaryCount = accounts.filter((account) => account.status === "TMP").length;
  const blockedCount = accounts.filter((account) => account.status === "BLK").length;
  const offlineCount = accounts.filter((account) => account.status === "OFF").length;
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || null;
  const reportEndDate = useMemo(
    () =>
      arbs.reduce(
        (latest, arb) =>
          arb.dateKey >= REPORT_START_DATE && arb.dateKey > latest ? arb.dateKey : latest,
        REPORT_START_DATE
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

  const periodAccountStats = useMemo(() => {
    const stats = new Map(
      accounts.map((account) => [account.id, { count: 0, profitUsd: 0 }])
    );
    const periodArbs = arbs.filter(
      (arb) => arb.dateKey >= REPORT_START_DATE && arb.dateKey <= reportEndDate
    );

    for (const arb of periodArbs) {
      const participatingAccountIds = new Set();

      for (const leg of arb.legs) {
        for (const account of accounts) {
          if (accountMatchesLeg(account, leg, accounts)) {
            participatingAccountIds.add(account.id);
          }
        }
      }

      if (!participatingAccountIds.size) {
        continue;
      }

      const allocatedProfitUsd = Number(arb.profitUsd || 0) / participatingAccountIds.size;

      for (const accountId of participatingAccountIds) {
        const current = stats.get(accountId);
        current.count += 1;
        current.profitUsd += allocatedProfitUsd;
      }
    }

    return new Map(
      Array.from(stats, ([accountId, value]) => [
        accountId,
        { ...value, profitUsd: Number(value.profitUsd.toFixed(2)) }
      ])
    );
  }, [accounts, arbs, reportEndDate]);

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
          <span className="pre-market-total"><strong>{preMarketCount}</strong> pre market</span>
          <span className="temporary-total"><strong>{temporaryCount}</strong> temporales</span>
          <span className="blocked-total"><strong>{blockedCount}</strong> bloqueadas</span>
          <span className="offline-total"><strong>{offlineCount}</strong> desconectadas</span>
          <span><strong>{formatPeriod(reportEndDate)}</strong> periodo</span>
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
                  const hasEmptyBalance = Number(account.balance) === 0;
                  const periodStats = periodAccountStats.get(account.id) || {
                    count: 0,
                    profitUsd: 0
                  };
                  const resultTone =
                    periodStats.profitUsd > 0
                      ? "is-profit"
                      : periodStats.profitUsd < 0
                        ? "is-loss"
                        : "is-neutral";

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`client-account ${statusClassName(account.status)} ${hasEmptyBalance ? "is-empty-balance" : ""} ${isSelected ? "is-selected" : ""}`}
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      type="button"
                    >
                      <span className="client-account-meta">
                        <span>{account.vps}</span>
                        <span className={`status-badge ${statusClassName(account.status)}`}>
                          <i aria-hidden="true" />
                          {account.status}
                        </span>
                      </span>
                      <strong>{formatAccountBalance(account.balance, account.currency)}</strong>
                      {hasEmptyBalance ? (
                        <span className="client-empty-warning">Cargar saldo</span>
                      ) : null}
                      <span className="client-account-activity">
                        <b>{periodStats.count}</b> arbs · {formatPeriod(reportEndDate)}
                      </span>
                      <span className={`client-account-result ${resultTone}`}>
                        {periodStats.count === 0
                          ? "Sin actividad"
                          : periodStats.profitUsd > 0
                          ? "Ganado"
                          : periodStats.profitUsd < 0
                            ? "Perdido"
                            : "Sin cambio"}
                        <b>{formatSignedUsd(periodStats.profitUsd)}</b>
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

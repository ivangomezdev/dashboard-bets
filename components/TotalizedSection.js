"use client";

import { useEffect, useMemo, useState } from "react";
import BookmakerName from "@/components/BookmakerName";

const REPORT_START_DATE = "2026-08-06";

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function canonicalBooker(value) {
  return normalize(value).replace(/(?:fallback|hedge)$/, "");
}

function matchesBooker(accountBooker, legBooker) {
  return canonicalBooker(accountBooker) === canonicalBooker(legBooker);
}

function accountMatchesLeg(account, leg, accounts) {
  if (leg.outcome === "not_placed") {
    return false;
  }

  if (!matchesBooker(account.booker, leg.bookerBase || leg.booker)) {
    return false;
  }

  const legVps = normalize(leg.vps);

  if (legVps) {
    return normalize(account.vps) === legVps;
  }

  const matchingAccounts = accounts.filter((candidate) =>
    matchesBooker(candidate.booker, leg.bookerBase || leg.booker)
  );

  if (matchingAccounts.length === 1) {
    return matchingAccounts[0].id === account.id;
  }

  const matchingCurrencyAccounts = matchingAccounts.filter(
    (candidate) =>
      String(candidate.currency).toUpperCase() === String(leg.currency).toUpperCase()
  );

  return matchingCurrencyAccounts.length === 1 && matchingCurrencyAccounts[0].id === account.id;
}

function formatDate(date) {
  const [year, month, day] = String(date || "").split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Sin fecha";
}

function formatSignedUsd(value) {
  const amount = Number(value || 0);
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${Math.abs(amount).toFixed(2)} USD`;
}

function formatBalance(value, currency) {
  return `${Number(value || 0).toFixed(2)} ${String(currency || "").toUpperCase()}`;
}

function resultTone(value) {
  return value > 0 ? "is-profit" : value < 0 ? "is-loss" : "is-neutral";
}

function clientLabel(vps) {
  const number = String(vps || "").match(/\d+/)?.[0];
  return number ? `Cliente ${number}` : vps;
}

function sumRows(rows) {
  return rows.reduce(
    (total, row) => ({
      count: total.count + row.count,
      profitUsd: total.profitUsd + row.profitUsd
    }),
    { count: 0, profitUsd: 0 }
  );
}

export default function TotalizedSection({ accounts, arbs }) {
  const [dimension, setDimension] = useState("client");
  const [selectedVps, setSelectedVps] = useState("");
  const [selectedBookerKey, setSelectedBookerKey] = useState("");

  const reportEndDate = useMemo(
    () =>
      arbs.reduce(
        (latest, arb) =>
          arb.dateKey >= REPORT_START_DATE && arb.dateKey > latest ? arb.dateKey : latest,
        REPORT_START_DATE
      ),
    [arbs]
  );

  const accountStats = useMemo(() => {
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

      const allocatedProfit = Number(arb.profitUsd || 0) / participatingAccountIds.size;

      for (const accountId of participatingAccountIds) {
        const current = stats.get(accountId);
        current.count += 1;
        current.profitUsd += allocatedProfit;
      }
    }

    return new Map(
      Array.from(stats, ([accountId, value]) => [
        accountId,
        { count: value.count, profitUsd: value.profitUsd }
      ])
    );
  }, [accounts, arbs, reportEndDate]);

  const accountRows = useMemo(
    () =>
      accounts.map((account) => ({
        ...account,
        ...(accountStats.get(account.id) || { count: 0, profitUsd: 0 })
      })),
    [accounts, accountStats]
  );

  const vpsOptions = useMemo(
    () =>
      Array.from(new Set(accounts.map((account) => account.vps))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
    [accounts]
  );

  const bookerGroups = useMemo(() => {
    const groups = new Map();

    for (const row of accountRows) {
      const key = canonicalBooker(row.booker);
      const group = groups.get(key) || { key, booker: row.booker, rows: [] };
      group.rows.push(row);
      groups.set(key, group);
    }

    return Array.from(groups.values())
      .map((group) => ({ ...group, ...sumRows(group.rows) }))
      .sort((a, b) => a.booker.localeCompare(b.booker, "es", { numeric: true }));
  }, [accountRows]);

  useEffect(() => {
    if (!vpsOptions.includes(selectedVps)) {
      setSelectedVps(vpsOptions[0] || "");
    }
  }, [selectedVps, vpsOptions]);

  useEffect(() => {
    if (!bookerGroups.some((group) => group.key === selectedBookerKey)) {
      setSelectedBookerKey(bookerGroups[0]?.key || "");
    }
  }, [bookerGroups, selectedBookerKey]);

  const clientRows = accountRows.filter((row) => row.vps === selectedVps);
  const selectedBooker = bookerGroups.find((group) => group.key === selectedBookerKey);
  const periodTotals = useMemo(() => {
    const periodArbs = arbs.filter(
      (arb) => arb.dateKey >= REPORT_START_DATE && arb.dateKey <= reportEndDate
    );

    return {
      count: periodArbs.length,
      profitUsd: periodArbs.reduce((sum, arb) => sum + Number(arb.profitUsd || 0), 0)
    };
  }, [arbs, reportEndDate]);

  return (
    <section className="totalized-section" aria-labelledby="totalized-title">
      <div className="totalized-overview">
        <div>
          <span className="eyebrow">Resultados consolidados</span>
          <h2 id="totalized-title">Totalizado</h2>
          <p>Ganancia y actividad desde {formatDate(REPORT_START_DATE)} hasta {formatDate(reportEndDate)}.</p>
        </div>
        <div className={`totalized-period-result ${resultTone(periodTotals.profitUsd)}`}>
          <span>{periodTotals.count} arbs</span>
          <strong>{formatSignedUsd(periodTotals.profitUsd)}</strong>
        </div>
      </div>

      <div className="totalized-dimension-toggle" aria-label="Agrupar totalizado">
        <button
          className={dimension === "client" ? "is-active" : ""}
          onClick={() => setDimension("client")}
          type="button"
        >
          Cliente
        </button>
        <button
          className={dimension === "booker" ? "is-active" : ""}
          onClick={() => setDimension("booker")}
          type="button"
        >
          Booker
        </button>
      </div>

      {dimension === "client" ? (
        <>
          <div className="totalized-selector-grid">
            {vpsOptions.map((vps) => {
              const rows = accountRows.filter((row) => row.vps === vps);
              const totals = sumRows(rows);

              return (
                <button
                  className={`totalized-selector ${selectedVps === vps ? "is-selected" : ""}`}
                  key={vps}
                  onClick={() => setSelectedVps(vps)}
                  type="button"
                >
                  <span>{clientLabel(vps)}</span>
                  <small>{vps} · {rows.length} casas · {totals.count} arbs</small>
                  <strong className={resultTone(totals.profitUsd)}>{formatSignedUsd(totals.profitUsd)}</strong>
                </button>
              );
            })}
          </div>

          <section className="totalized-detail-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Detalle por cliente</span>
                <h2>{clientLabel(selectedVps)} · {selectedVps}</h2>
              </div>
              <span className="result-count">{clientRows.length} casas</span>
            </div>
            <div className="totalized-result-grid">
              {clientRows.map((row) => (
                <article className="totalized-result-card" key={row.id}>
                  <BookmakerName name={row.booker} />
                  <span className="totalized-account-meta">{row.status} · {formatBalance(row.balance, row.currency)}</span>
                  <span>{row.count} arbs</span>
                  <strong className={resultTone(row.profitUsd)}>{formatSignedUsd(row.profitUsd)}</strong>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="totalized-booker-grid">
            {bookerGroups.map((group) => (
              <button
                className={`totalized-booker-button ${selectedBookerKey === group.key ? "is-selected" : ""}`}
                key={group.key}
                onClick={() => setSelectedBookerKey(group.key)}
                type="button"
              >
                <BookmakerName name={group.booker} />
                <small>{group.rows.length} clientes · {group.count} arbs</small>
                <strong className={resultTone(group.profitUsd)}>{formatSignedUsd(group.profitUsd)}</strong>
              </button>
            ))}
          </div>

          {selectedBooker ? (
            <section className="totalized-detail-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Booker en todos los clientes</span>
                  <h2><BookmakerName name={selectedBooker.booker} /></h2>
                </div>
                <span className="result-count">{formatSignedUsd(selectedBooker.profitUsd)}</span>
              </div>
              <div className="totalized-result-grid">
                {selectedBooker.rows
                  .slice()
                  .sort((a, b) => a.vps.localeCompare(b.vps, undefined, { numeric: true }))
                  .map((row) => (
                    <article className="totalized-result-card" key={row.id}>
                      <strong>{clientLabel(row.vps)}</strong>
                      <span className="totalized-account-meta">{row.vps} · {row.status}</span>
                      <span>{row.count} arbs</span>
                      <strong className={resultTone(row.profitUsd)}>{formatSignedUsd(row.profitUsd)}</strong>
                    </article>
                  ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ArbsTable from "@/components/ArbsTable";
import BookmakerName from "@/components/BookmakerName";
import { accountMatchesLeg, DAILY_VPS_START_DATE, getDailyVpsActivity } from "@/lib/accountReporting";

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatSignedMoney(value, currency) {
  const amount = Number(value || 0);
  const rounded = Math.abs(amount) < 0.005 ? 0 : amount;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "-" : "";
  return `${sign}$${formatNumber(Math.abs(rounded))} ${currency}`;
}

function formatShortDate(date) {
  const [year, month, day] = String(date || "").split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Sin fecha";
}

export default function DailyVpsSection({ accounts, arbs, daily }) {
  const latestDate = useMemo(() => {
    const dates = Array.from(new Set([
      ...daily.map((day) => day.date),
      ...arbs.map((arb) => arb.placedDateKey)
    ])).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= DAILY_VPS_START_DATE).sort();

    return dates[dates.length - 1] || DAILY_VPS_START_DATE;
  }, [arbs, daily]);

  const [selectedDate, setSelectedDate] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const resultsRef = useRef(null);

  const date = selectedDate && selectedDate >= DAILY_VPS_START_DATE ? selectedDate : latestDate;

  const dailyStats = useMemo(
    () => getDailyVpsActivity(accounts, arbs, date),
    [accounts, arbs, date]
  );

  const vpsGroups = useMemo(() => {
    const groups = new Map();

    for (const account of accounts) {
      const stats = dailyStats.get(account.id);
      const hasActivity = stats.placedCount > 0 || stats.settledCount > 0;
      const isVisible =
        (account.status === "ON" || hasActivity || showHistorical) &&
        (!onlyActive || hasActivity);

      if (!isVisible) continue;

      const vpsKey = account.vps || "Sin VPS";
      const group = groups.get(vpsKey) || {
        vps: vpsKey,
        accounts: [],
        placedCount: 0,
        settledCount: 0,
        profitMxn: 0,
        profitUsd: 0
      };

      group.accounts.push({ account, stats, hasActivity });
      group.placedCount += stats.placedCount;
      group.settledCount += stats.settledCount;
      group.profitMxn += stats.profitMxn;
      group.profitUsd += stats.profitUsd;
      groups.set(vpsKey, group);
    }

    for (const group of groups.values()) {
      group.accounts.sort((a, b) =>
        a.account.booker.localeCompare(b.account.booker, "es", { numeric: true })
      );
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.vps.localeCompare(b.vps, "es", { numeric: true })
    );
  }, [accounts, dailyStats, onlyActive, showHistorical]);

  const summary = useMemo(() => {
    let totalPlaced = 0;
    let totalProfitMxn = 0;
    let totalProfitUsd = 0;
    let activeVpsCount = 0;

    for (const group of vpsGroups) {
      totalPlaced += group.placedCount;
      totalProfitMxn += group.profitMxn;
      totalProfitUsd += group.profitUsd;
      if (group.placedCount > 0 || group.settledCount > 0) {
        activeVpsCount += 1;
      }
    }

    return { totalPlaced, totalProfitMxn, totalProfitUsd, activeVpsCount };
  }, [vpsGroups]);

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || null;

  const selectedArbs = useMemo(() => {
    if (!selectedAccount) return [];

    return arbs.filter((arb) => {
      if (arb.synthetic || arb.dateKey < DAILY_VPS_START_DATE) return false;
      const placedDate = arb.placedDateKey || arb.dateKey;
      if (arb.dateKey !== date && placedDate !== date) return false;

      return arb.legs.some(
        (leg) => leg.outcome !== "missing" && accountMatchesLeg(selectedAccount, leg, accounts)
      );
    });
  }, [accounts, arbs, date, selectedAccount]);

  useEffect(() => {
    if (selectedAccountId) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedAccountId]);

  const summaryTone =
    summary.totalProfitMxn > 0.005
      ? "is-profit"
      : summary.totalProfitMxn < -0.005
        ? "is-loss"
        : "is-neutral";

  return (
    <section className="clients-section daily-vps-section" aria-labelledby="daily-vps-title">
      <div className="clients-overview">
        <div>
          <h2 id="daily-vps-title">Actividad diaria por VPS · {formatShortDate(date)}</h2>
          <p>
            Cada recuadro agrupa las casas de apuestas registradas en Clientes para ese VPS,
            mostrando las apuestas colocadas y la ganancia neta del día seleccionado (datos a partir del {formatShortDate(DAILY_VPS_START_DATE)}).
          </p>
          <div className="daily-vps-summary">
            <span className="daily-vps-pill">
              <strong>{summary.totalPlaced}</strong> {summary.totalPlaced === 1 ? "apuesta colocada" : "apuestas colocadas"}
            </span>
            <span className="daily-vps-pill">
              <strong>{summary.activeVpsCount}</strong> {summary.activeVpsCount === 1 ? "VPS con actividad" : "VPS con actividad"}
            </span>
            <span className={`daily-vps-pill ${summaryTone}`}>
              <strong>{formatSignedMoney(summary.totalProfitMxn, "MXN")}</strong>
              <small>{formatSignedMoney(summary.totalProfitUsd, "USD")}</small>
            </span>
          </div>
        </div>

        <div className="clients-controls">
          <label className="clients-date">
            Fecha
            <input
              type="date"
              min={DAILY_VPS_START_DATE}
              value={date}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSelectedAccountId(null);
              }}
            />
          </label>
          <label className="clients-history-toggle">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(event) => setOnlyActive(event.target.checked)}
            />
            Solo mostrar casas con actividad ese día
          </label>
          <label className="clients-history-toggle">
            <input
              type="checkbox"
              checked={showHistorical}
              onChange={(event) => setShowHistorical(event.target.checked)}
            />
            Mostrar cuentas inactivas sin actividad
          </label>
        </div>
      </div>

      {vpsGroups.length === 0 ? (
        <div className="client-arbs-section client-selection-prompt">
          <h2>Sin actividad registrada para {formatShortDate(date)}</h2>
          <p>Selecciona otra fecha o desmarca el filtro de solo actividad.</p>
        </div>
      ) : (
        <div className="client-booker-grid">
          {vpsGroups.map((group) => {
            const groupTone =
              group.profitMxn > 0.005
                ? "is-profit"
                : group.profitMxn < -0.005
                  ? "is-loss"
                  : "is-neutral";

            return (
              <article className="client-booker-card" key={group.vps}>
                <div className="client-booker-heading">
                  <span>{group.vps}</span>
                  <div className="daily-vps-card-meta">
                    <small>{group.placedCount} {group.placedCount === 1 ? "apuesta" : "apuestas"}</small>
                    <span className={`daily-vps-total ${groupTone}`}>
                      {formatSignedMoney(group.profitMxn, "MXN")}
                    </span>
                  </div>
                </div>

                <div className="client-account-list">
                  {group.accounts.map(({ account, stats, hasActivity }) => {
                    const isSelected = account.id === selectedAccountId;
                    const rowTone =
                      stats.profitMxn > 0.005
                        ? "is-profit"
                        : stats.profitMxn < -0.005
                          ? "is-loss"
                          : "is-neutral";

                    return (
                      <button
                        aria-pressed={isSelected}
                        className={`client-account daily-vps-row ${hasActivity ? "has-activity" : ""} ${isSelected ? "is-selected" : ""}`}
                        key={account.id}
                        onClick={() => setSelectedAccountId(account.id)}
                        type="button"
                      >
                        <span className="daily-vps-booker">
                          <BookmakerName name={account.booker} />
                        </span>
                        <span className="client-account-metric">
                          <span>Apuestas colocadas</span>
                          <b>
                            {stats.placedCount}
                            {stats.settledCount > 0 && stats.placedCount === 0
                              ? ` (${stats.settledCount} ${stats.settledCount === 1 ? "cierre" : "cierres"})`
                              : ""}
                          </b>
                        </span>
                        <span className={`client-account-result ${rowTone}`}>
                          <span>Ganancia</span>
                          <b>{stats.settledCount ? formatSignedMoney(stats.profitMxn, "MXN") : "$0.00 MXN"}</b>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="client-arbs-section" aria-live="polite" ref={resultsRef}>
        {selectedAccount ? (
          <>
            <div className="section-heading">
              <div>
                <h2>
                  {selectedAccount.vps} · {selectedAccount.booker} ({formatShortDate(date)})
                </h2>
              </div>
              <span className="result-count">{selectedArbs.length} arbs encontrados</span>
            </div>
            <ArbsTable arbs={selectedArbs} />
          </>
        ) : (
          <div className="client-selection-prompt">
            <h2>Selecciona una casa dentro de un VPS</h2>
            <p>Consulta el detalle de las apuestas colocadas o cerradas ese día en esa cuenta.</p>
          </div>
        )}
      </section>
    </section>
  );
}

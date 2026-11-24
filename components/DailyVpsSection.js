"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ArbsTable from "@/components/ArbsTable";
import BookmakerName from "@/components/BookmakerName";
import {
  accountMatchesLeg,
  canonicalBooker,
  DAILY_VPS_START_DATE,
  getDailyVpsActivity
} from "@/lib/accountReporting";

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

function formatStakes(stakesMap) {
  if (!stakesMap || stakesMap.size === 0) return "Sin apuestas";
  return Array.from(stakesMap, ([currency, value]) => `${formatNumber(value)} ${currency}`).join(" · ");
}

function formatShortDate(date) {
  const [year, month, day] = String(date || "").split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Sin fecha";
}

function getTone(value) {
  if (value > 0.005) return "is-profit";
  if (value < -0.005) return "is-loss";
  return "is-neutral";
}

export default function DailyVpsSection({ accounts, arbs, daily }) {
  const latestDate = useMemo(() => {
    const dates = Array.from(new Set([
      ...daily.map((day) => day.date),
      ...arbs.map((arb) => arb.placedDateKey)
    ])).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= DAILY_VPS_START_DATE).sort();

    return dates[dates.length - 1] || DAILY_VPS_START_DATE;
  }, [arbs, daily]);

  const [viewMode, setViewMode] = useState("vps");
  const [selectedDate, setSelectedDate] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  const [selectedFamilyKey, setSelectedFamilyKey] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const resultsRef = useRef(null);

  const date = selectedDate && selectedDate >= DAILY_VPS_START_DATE ? selectedDate : latestDate;

  const dailyStats = useMemo(
    () => getDailyVpsActivity(accounts, arbs, date),
    [accounts, arbs, date]
  );

  const visibleEntries = useMemo(() => {
    const list = [];

    for (const account of accounts) {
      const stats = dailyStats.get(account.id);
      const hasActivity = stats.placedCount > 0 || stats.settledCount > 0;
      const isVisible =
        (account.status === "ON" || hasActivity || showHistorical) &&
        (!onlyActive || hasActivity);

      if (!isVisible) continue;
      list.push({ account, stats, hasActivity });
    }

    return list;
  }, [accounts, dailyStats, onlyActive, showHistorical]);

  const vpsGroups = useMemo(() => {
    const groups = new Map();

    for (const entry of visibleEntries) {
      const { account, stats } = entry;
      const vpsKey = account.vps || "Sin VPS";
      const group = groups.get(vpsKey) || {
        vps: vpsKey,
        accounts: [],
        placedCount: 0,
        settledCount: 0,
        profitMxn: 0,
        profitUsd: 0
      };

      group.accounts.push(entry);
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
  }, [visibleEntries]);

  const familyGroups = useMemo(() => {
    const groups = new Map();

    for (const entry of visibleEntries) {
      const { account, stats } = entry;
      const key = canonicalBooker(account.booker);
      const group = groups.get(key) || {
        key,
        booker: account.booker,
        accounts: [],
        placedCount: 0,
        settledCount: 0,
        profitMxn: 0,
        profitUsd: 0,
        stakes: new Map()
      };

      group.accounts.push(entry);
      group.placedCount += stats.placedCount;
      group.settledCount += stats.settledCount;
      group.profitMxn += stats.profitMxn;
      group.profitUsd += stats.profitUsd;
      for (const [currency, amount] of stats.stakes.entries()) {
        group.stakes.set(currency, (group.stakes.get(currency) || 0) + amount);
      }
      groups.set(key, group);
    }

    for (const group of groups.values()) {
      group.accounts.sort((a, b) =>
        a.account.vps.localeCompare(b.account.vps, "es", { numeric: true })
      );
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.booker.localeCompare(b.booker, "es", { numeric: true })
    );
  }, [visibleEntries]);

  const activeFamily = useMemo(() => {
    if (!familyGroups.length) return null;
    return familyGroups.find((group) => group.key === selectedFamilyKey) || familyGroups[0];
  }, [familyGroups, selectedFamilyKey]);

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

  function openFamilyComparison(bookerName) {
    setSelectedFamilyKey(canonicalBooker(bookerName));
    setViewMode("family");
    setSelectedAccountId(null);
  }

  return (
    <section className="clients-section daily-vps-section" aria-labelledby="daily-vps-title">
      <div className="clients-overview">
        <div>
          <h2 id="daily-vps-title">Actividad diaria · {formatShortDate(date)}</h2>
          <p>
            Consulta las cuentas de Clientes agrupadas por <strong>VPS</strong> o compara una misma{" "}
            <strong>familia (casa de apuestas)</strong> en todos sus VPS para el día seleccionado
            (datos a partir del {formatShortDate(DAILY_VPS_START_DATE)}).
          </p>
          <div className="daily-vps-summary">
            <span className="daily-vps-pill">
              <strong>{summary.totalPlaced}</strong> {summary.totalPlaced === 1 ? "apuesta colocada" : "apuestas colocadas"}
            </span>
            <span className="daily-vps-pill">
              <strong>{summary.activeVpsCount}</strong> VPS con actividad
            </span>
            <span className={`daily-vps-pill ${getTone(summary.totalProfitMxn)}`}>
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

      <div className="totalized-dimension-toggle" role="tablist" aria-label="Modo de comparación diario">
        <button
          aria-selected={viewMode === "vps"}
          className={viewMode === "vps" ? "is-active" : ""}
          onClick={() => setViewMode("vps")}
          role="tab"
          type="button"
        >
          Por VPS ({vpsGroups.length})
        </button>
        <button
          aria-selected={viewMode === "family"}
          className={viewMode === "family" ? "is-active" : ""}
          onClick={() => setViewMode("family")}
          role="tab"
          type="button"
        >
          Comparar por familia / Casa ({familyGroups.length})
        </button>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="client-arbs-section client-selection-prompt">
          <h2>Sin actividad registrada para {formatShortDate(date)}</h2>
          <p>Selecciona otra fecha o desmarca el filtro de solo actividad.</p>
        </div>
      ) : viewMode === "vps" ? (
        <div className="client-booker-grid">
          {vpsGroups.map((group) => (
            <article className="client-booker-card" key={group.vps}>
              <div className="client-booker-heading">
                <span>{group.vps}</span>
                <div className="daily-vps-card-meta">
                  <small>{group.placedCount} {group.placedCount === 1 ? "apuesta" : "apuestas"}</small>
                  <span className={`daily-vps-total ${getTone(group.profitMxn)}`}>
                    {formatSignedMoney(group.profitMxn, "MXN")}
                  </span>
                </div>
              </div>

              <div className="client-account-list">
                {group.accounts.map(({ account, stats, hasActivity }) => {
                  const isSelected = account.id === selectedAccountId;

                  return (
                    <div
                      className={`client-account daily-vps-row ${hasActivity ? "has-activity" : ""} ${isSelected ? "is-selected" : ""}`}
                      key={account.id}
                    >
                      <div className="daily-vps-booker">
                        <button
                          className="daily-vps-booker-trigger"
                          onClick={() => openFamilyComparison(account.booker)}
                          title={`Comparar ${account.booker} en todos los VPS`}
                          type="button"
                        >
                          <BookmakerName name={account.booker} />
                        </button>
                        <button
                          className="daily-vps-compare-link"
                          onClick={() => openFamilyComparison(account.booker)}
                          type="button"
                        >
                          Comparar VPS
                        </button>
                      </div>

                      <button
                        aria-pressed={isSelected}
                        className="daily-vps-row-body"
                        onClick={() => setSelectedAccountId(account.id)}
                        type="button"
                      >
                        <span className="client-account-metric">
                          <span>Apuestas colocadas</span>
                          <b>
                            {stats.placedCount}
                            {stats.settledCount > 0 && stats.placedCount === 0
                              ? ` (${stats.settledCount} ${stats.settledCount === 1 ? "cierre" : "cierres"})`
                              : ""}
                          </b>
                        </span>
                        <span className={`client-account-result ${getTone(stats.profitMxn)}`}>
                          <span>Ganancia</span>
                          <b>{stats.settledCount ? formatSignedMoney(stats.profitMxn, "MXN") : "$0.00 MXN"}</b>
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="daily-family-layout">
          <div className="totalized-booker-grid" aria-label="Familias de casas de apuestas">
            {familyGroups.map((group) => {
              const isSelected = activeFamily?.key === group.key;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`totalized-booker-button ${isSelected ? "is-selected" : ""}`}
                  key={group.key}
                  onClick={() => {
                    setSelectedFamilyKey(group.key);
                    setSelectedAccountId(null);
                  }}
                  type="button"
                >
                  <BookmakerName name={group.booker} />
                  <small>
                    {group.accounts.length} VPS · {group.placedCount} {group.placedCount === 1 ? "apuesta" : "apuestas"}
                  </small>
                  <strong className={group.profitMxn > 0.005 ? "positive" : group.profitMxn < -0.005 ? "negative" : ""}>
                    {group.settledCount ? formatSignedMoney(group.profitMxn, "MXN") : "$0.00 MXN"}
                  </strong>
                </button>
              );
            })}
          </div>

          {activeFamily ? (
            <section className="totalized-detail-panel" aria-live="polite">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Comparativa por familia · {formatShortDate(date)}</span>
                  <h2 className="daily-family-heading">
                    <BookmakerName name={activeFamily.booker} />
                  </h2>
                </div>
                <div className="daily-vps-summary">
                  <span className="daily-vps-pill">
                    <strong>{activeFamily.accounts.length}</strong> VPS
                  </span>
                  <span className="daily-vps-pill">
                    <strong>{activeFamily.placedCount}</strong> {activeFamily.placedCount === 1 ? "apuesta" : "apuestas"}
                  </span>
                  <span className="daily-vps-pill">
                    <strong>{formatStakes(activeFamily.stakes)}</strong>
                  </span>
                  <span className={`daily-vps-pill ${getTone(activeFamily.profitMxn)}`}>
                    <strong>{formatSignedMoney(activeFamily.profitMxn, "MXN")}</strong>
                    <small>{formatSignedMoney(activeFamily.profitUsd, "USD")}</small>
                  </span>
                </div>
              </div>

              <div className="totalized-result-grid">
                {activeFamily.accounts.map(({ account, stats, hasActivity }) => {
                  const isSelected = account.id === selectedAccountId;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`client-account daily-vps-row ${hasActivity ? "has-activity" : ""} ${isSelected ? "is-selected" : ""}`}
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      type="button"
                    >
                      <span className="client-account-meta">
                        <span>{account.vps}</span>
                        {account.status !== "ON" ? (
                          <span className="status-badge is-neutral">{account.status}</span>
                        ) : (
                          <span className="status-badge is-active-vps">Activa</span>
                        )}
                      </span>
                      <span className="client-account-metric">
                        <span>Apuestas colocadas</span>
                        <b>{stats.placedCount}</b>
                      </span>
                      <span className="client-account-metric">
                        <span>Apostado</span>
                        <b>{formatStakes(stats.stakes)}</b>
                      </span>
                      <span className="client-account-metric">
                        <span>Cierres del día</span>
                        <b>{stats.settledCount}</b>
                      </span>
                      <span className={`client-account-result ${getTone(stats.profitMxn)}`}>
                        <span>Ganancia</span>
                        <b>
                          {stats.settledCount
                            ? `${formatSignedMoney(stats.profitMxn, "MXN")} (${formatSignedMoney(stats.profitUsd, "USD")})`
                            : "$0.00 MXN"}
                        </b>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
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
              <div className="daily-vps-card-meta">
                {viewMode === "vps" ? (
                  <button
                    className="secondary-button"
                    onClick={() => openFamilyComparison(selectedAccount.booker)}
                    type="button"
                  >
                    Comparar {selectedAccount.booker} en todos los VPS
                  </button>
                ) : null}
                <span className="result-count">{selectedArbs.length} arbs encontrados</span>
              </div>
            </div>
            <ArbsTable arbs={selectedArbs} />
          </>
        ) : (
          <div className="client-selection-prompt">
            <h2>Selecciona una cuenta</h2>
            <p>
              Haz clic en el nombre de cualquier casa para comparar esa familia en todos sus VPS,
              o en sus métricas para ver el detalle de arbs del día.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}

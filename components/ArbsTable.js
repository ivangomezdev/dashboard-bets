"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateTime, formatMoney, formatMxnAsUsd, formatNumber, profitClass } from "@/lib/format";
import BookmakerName from "@/components/BookmakerName";

const PAGE_SIZE_OPTIONS = [10, 20];

function inferSport(arb) {
  const text = [
    arb.event,
    arb.market,
    ...arb.legs.flatMap((leg) => [leg.market, leg.selection])
  ].join(" ").toLowerCase();
  const event = String(arb.event || "");

  if (
    text.includes("total games") ||
    text.includes("game handicap") ||
    text.includes("total de juegos") ||
    text.includes("handicap de juego") ||
    text.includes("hándicap de juego") ||
    text.includes("set winner") ||
    event.includes(",") ||
    event.includes(" / ")
  ) {
    return { icon: "🎾", label: "Tennis" };
  }

  return { icon: "⚽", label: "Futbol" };
}

export default function ArbsTable({ arbs }) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(arbs.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [arbs, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleArbs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return arbs.slice(start, start + pageSize);
  }, [arbs, page, pageSize]);

  if (!arbs.length) {
    return <div className="empty-state">No hay arbs con esos filtros.</div>;
  }

  const firstVisible = (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, arbs.length);

  return (
    <>
      <div className="table-pagination" aria-label="Paginacion de arbs">
        <span>
          Mostrando {firstVisible}-{lastVisible} de {arbs.length}
        </span>
        <div className="pagination-controls">
          <label>
            Filas por pagina
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
            Anterior
          </button>
          <span>Pagina {page} de {totalPages}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>
            Siguiente
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="arbs-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Evento</th>
              <th>Mercado</th>
              <th>Stake USD</th>
              <th>Payout USD</th>
              <th>Resultado USD</th>
              <th>Ganador</th>
            </tr>
          </thead>
          <tbody>
            {visibleArbs.map((arb) => {
              const sport = inferSport(arb);

              return (
                <tr key={arb.id}>
                  <td>
                    <span className="muted">{arb.dateKey}</span>
                    <small>{formatDateTime(arb.createdAt || arb.closedAt)}</small>
                  </td>
                  <td>
                    <details>
                      <summary>
                        <span className="event-title">
                          <span aria-label={sport.label} className="sport-icon" role="img">
                            {sport.icon}
                          </span>
                          <span>{arb.event}</span>
                        </span>
                      </summary>
                      <div className="legs-list">
                        {arb.legs.map((leg) => (
                          <div className="leg-item" key={`${arb.id}-${leg.index}`}>
                            <BookmakerName name={leg.bookerLabel || leg.booker} className="leg-bookmaker" />
                            <strong>{leg.selection}</strong>
                            <small>
                              {leg.market} - cuota {formatNumber(leg.odds)} - {formatMoney(leg.stake, leg.currency)}
                            </small>
                          </div>
                        ))}
                        {arb.reason && !/^verificacion periodica/i.test(arb.reason) ? (
                          <div className="arb-reason">
                            <strong>Motivo:</strong> {arb.reason}
                          </div>
                        ) : null}
                      </div>
                    </details>
                  </td>
                  <td>{arb.market}</td>
                  <td>{formatMxnAsUsd(arb.totalStakeMxn)}</td>
                  <td>{formatMxnAsUsd(arb.payoutMxn)}</td>
                  <td className={profitClass(arb.profitUsd)}>{formatMoney(arb.profitUsd, "USD")}</td>
                  <td><BookmakerName name={arb.winningBooker} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

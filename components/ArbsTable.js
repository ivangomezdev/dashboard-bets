import { formatDateTime, formatMoney, formatMxnAsUsd, formatNumber, profitClass } from "@/lib/format";
import BookmakerName from "@/components/BookmakerName";

export default function ArbsTable({ arbs }) {
  if (!arbs.length) {
    return <div className="empty-state">No hay arbs con esos filtros.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="arbs-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Evento</th>
            <th>Mercado</th>
            <th>Stake</th>
            <th>Payout</th>
            <th>Resultado USD</th>
            <th>Ganador</th>
          </tr>
        </thead>
        <tbody>
          {arbs.map((arb) => (
            <tr key={arb.id}>
              <td>
                <span className="muted">{arb.dateKey}</span>
                <small>{formatDateTime(arb.closedAt)}</small>
              </td>
              <td>
                <details>
                  <summary>
                    {arb.event}
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
                  </div>
                </details>
              </td>
              <td>{arb.market}</td>
              <td>{formatMoney(arb.totalStakeMxn)}</td>
              <td>{formatMoney(arb.payoutMxn)}</td>
              <td className={profitClass(arb.profitMxn)}>{formatMxnAsUsd(arb.profitMxn)}</td>
              <td><BookmakerName name={arb.winningBooker} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

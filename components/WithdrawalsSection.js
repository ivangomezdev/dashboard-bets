"use client";

import { useState } from "react";
import BookmakerName from "@/components/BookmakerName";
import { formatMoney } from "@/lib/format";

function formatDate(date) {
  const [year, month, day] = String(date || "").split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Sin fecha";
}

export default function WithdrawalsSection({ withdrawals }) {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const totalUsdt = withdrawals.reduce(
    (sum, withdrawal) => sum + Number(withdrawal.amount || 0),
    0
  );

  return (
    <section className="withdrawals-section" aria-labelledby="withdrawals-title">
      <div className="withdrawals-overview">
        <div>
          <span className="eyebrow">Historial de movimientos</span>
          <h2 id="withdrawals-title">Retiros</h2>
          <p>Selecciona un retiro para consultar su comprobante y desglose.</p>
        </div>
        <div className="withdrawals-total">
          <span>{withdrawals.length} retiro</span>
          <strong>{formatMoney(totalUsdt, "USDT")}</strong>
        </div>
      </div>

      <div className="withdrawals-list">
        {withdrawals.map((withdrawal) => (
          <button
            className="withdrawal-card"
            key={withdrawal.id}
            onClick={() => setSelectedWithdrawal(withdrawal)}
            type="button"
          >
            <span className="withdrawal-card-main">
              <BookmakerName name={withdrawal.bookmaker} />
              <small>{withdrawal.vps} · {formatDate(withdrawal.date)}</small>
            </span>
            <span className="withdrawal-amount">
              <strong>{withdrawal.amount.toFixed(2)} {withdrawal.currency}</strong>
              <small>Ver comprobante</small>
            </span>
            <span className="withdrawal-status">{withdrawal.status}</span>
          </button>
        ))}
      </div>

      {selectedWithdrawal ? (
        <div
          className="withdrawal-backdrop"
          onClick={() => setSelectedWithdrawal(null)}
          role="presentation"
        >
          <section
            aria-labelledby="withdrawal-detail-title"
            aria-modal="true"
            className="withdrawal-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Comprobante de retiro</span>
                <h2 id="withdrawal-detail-title">
                  {selectedWithdrawal.bookmaker} · {selectedWithdrawal.vps} · {formatDate(selectedWithdrawal.date)}
                </h2>
              </div>
              <button
                className="ghost-button"
                onClick={() => setSelectedWithdrawal(null)}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <div className="withdrawal-detail-grid">
              <div className="withdrawal-receipt">
                <img
                  alt={`Comprobante del retiro de ${selectedWithdrawal.bookmaker}`}
                  src={selectedWithdrawal.receiptImage}
                />
              </div>
              <dl className="withdrawal-details">
                <div><dt>Monto retirado</dt><dd>{selectedWithdrawal.amount.toFixed(2)} {selectedWithdrawal.currency}</dd></div>
                <div><dt>Monto recibido aprox.</dt><dd>{selectedWithdrawal.receivedAmount.toFixed(2)} {selectedWithdrawal.currency}</dd></div>
              </dl>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

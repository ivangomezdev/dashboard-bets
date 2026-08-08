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
              <small>{formatDate(withdrawal.date)}</small>
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
                  {selectedWithdrawal.bookmaker} · {formatDate(selectedWithdrawal.date)}
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
                <div><dt>Monto recibido</dt><dd>{selectedWithdrawal.amount.toFixed(2)} {selectedWithdrawal.currency}</dd></div>
                <div><dt>Equivalente</dt><dd>{formatMoney(selectedWithdrawal.approximateMxn, "MXN")}</dd></div>
                <div><dt>Dirección</dt><dd>{selectedWithdrawal.address}</dd></div>
                <div><dt>Red</dt><dd>{selectedWithdrawal.network}</dd></div>
                <div><dt>Tiempo estimado</dt><dd>{selectedWithdrawal.estimatedTime}</dd></div>
                <div><dt>Tipo de cambio</dt><dd>{selectedWithdrawal.exchangeRate}</dd></div>
                <div><dt>Comisión cambiaria</dt><dd>{formatMoney(selectedWithdrawal.exchangeFeeMxn, "MXN")}</dd></div>
                <div><dt>Comisión 2%</dt><dd>{formatMoney(selectedWithdrawal.transactionFeeMxn, "MXN")}</dd></div>
                <div><dt>Comisión de red</dt><dd>{formatMoney(selectedWithdrawal.networkFeeMxn, "MXN")}</dd></div>
                <div className="withdrawal-spent"><dt>Gasto total</dt><dd>{formatMoney(selectedWithdrawal.totalSpentMxn, "MXN")}</dd></div>
              </dl>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

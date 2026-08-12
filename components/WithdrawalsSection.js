"use client";

import { useState } from "react";
import BookmakerName from "@/components/BookmakerName";

function formatDate(date) {
  const [year, month, day] = String(date || "").split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Sin fecha";
}

export default function WithdrawalsSection({ withdrawals }) {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const withdrawalCount = withdrawals.filter(
    (movement) => movement.movementType === "Retiro"
  ).length;
  const paymentCount = withdrawals.filter(
    (movement) => movement.movementType === "Pago"
  ).length;
  const depositCount = withdrawals.filter(
    (movement) => movement.movementType === "Depósito"
  ).length;

  return (
    <section className="withdrawals-section" aria-labelledby="withdrawals-title">
      <div className="withdrawals-overview">
        <div>
          <span className="eyebrow">Historial de movimientos</span>
          <h2 id="withdrawals-title">Retiros</h2>
          <p>Selecciona un movimiento para consultar su comprobante.</p>
        </div>
        <div className="withdrawals-total">
          <span>{withdrawals.length} movimientos</span>
          <strong>{withdrawalCount} retiros · {paymentCount} pago · {depositCount} depósito</strong>
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
              <small>{withdrawal.receiptImage ? "Ver comprobante" : "Ver detalle"}</small>
            </span>
            <span className={`withdrawal-status ${withdrawal.movementType === "Pago" ? "is-payment" : ""} ${withdrawal.movementType === "Depósito" ? "is-deposit" : ""}`}>
              {withdrawal.movementType}
            </span>
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
                <span className="eyebrow">
                  {selectedWithdrawal.receiptImage ? "Comprobante" : "Detalle"} de {selectedWithdrawal.movementType.toLowerCase()}
                </span>
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

            <div className={`withdrawal-detail-grid ${selectedWithdrawal.receiptImage ? "" : "is-details-only"}`}>
              {selectedWithdrawal.receiptImage ? (
                <div className="withdrawal-receipt">
                  <img
                    alt={`Comprobante de ${selectedWithdrawal.movementType.toLowerCase()} de ${selectedWithdrawal.bookmaker}`}
                    src={selectedWithdrawal.receiptImage}
                  />
                </div>
              ) : null}
              <dl className="withdrawal-details">
                <div>
                  <dt>
                    {selectedWithdrawal.movementType === "Pago"
                      ? "Monto pagado"
                      : selectedWithdrawal.movementType === "Depósito"
                        ? "Monto depositado"
                        : "Monto retirado"}
                  </dt>
                  <dd>{selectedWithdrawal.amount.toFixed(2)} {selectedWithdrawal.currency}</dd>
                </div>
                {selectedWithdrawal.receivedAmount !== undefined ? (
                  <div>
                    <dt>Monto recibido aprox.</dt>
                    <dd>{selectedWithdrawal.receivedAmount.toFixed(2)} {selectedWithdrawal.receivedCurrency || selectedWithdrawal.currency}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

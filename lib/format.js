export const USD_RATE_MXN = 17.21;

export function formatMoney(value, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export function mxnToUsd(value) {
  return Number(value || 0) / USD_RATE_MXN;
}

export function formatMxnAsUsd(value) {
  return formatMoney(mxnToUsd(value), "USD");
}

export function formatNumber(value) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export function formatDateTime(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function profitClass(value) {
  return Number(value || 0) >= 0 ? "positive" : "negative";
}

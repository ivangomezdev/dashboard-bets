export const USD_RATE_MXN = 17.21;

export function formatMoney(value, currency = "MXN") {
  const amount = Number(value || 0);
  const normalizedCurrency = String(currency || "MXN").toUpperCase();

  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    const formattedAmount = new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);

    return `${normalizedCurrency} ${formattedAmount}`;
  }
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

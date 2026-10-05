export const REPORT_START_DATE = "2026-08-06";
export const REPORT_END_DATE = "2026-10-04";

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function canonicalBooker(value) {
  return normalize(value).replace(/(?:fallback|hedge)$/, "");
}

export function accountMatchesLeg(account, leg, accounts) {
  if (leg.outcome === "not_placed" ||
      canonicalBooker(account.booker) !== canonicalBooker(leg.bookerBase || leg.booker)) {
    return false;
  }
  if (normalize(leg.vps)) return normalize(account.vps) === normalize(leg.vps);

  const candidates = accounts.filter((item) =>
    canonicalBooker(item.booker) === canonicalBooker(leg.bookerBase || leg.booker));
  if (candidates.length === 1) return candidates[0].id === account.id;
  const currencyCandidates = candidates.filter((item) =>
    String(item.currency).toUpperCase() === String(leg.currency).toUpperCase());
  return currencyCandidates.length === 1 && currencyCandidates[0].id === account.id;
}

export function getPeriodArbs(arbs) {
  return arbs.filter((arb) => arb.dateKey >= REPORT_START_DATE && arb.dateKey <= REPORT_END_DATE);
}

export function getReportEndDate(arbs) {
  return getPeriodArbs(arbs).reduce((latest, arb) =>
    arb.dateKey > latest ? arb.dateKey : latest, REPORT_START_DATE);
}

// Conserva el reparto del beneficio neto del arb entre las cuentas participantes.
// No representa el saldo de la cuenta ni el retorno individual de cada leg.
export function getAccountStats(accounts, arbs) {
  const stats = new Map(accounts.map((account) => [account.id, { count: 0, profitUsd: 0 }]));
  for (const arb of getPeriodArbs(arbs)) {
    const accountIds = new Set();
    for (const leg of arb.legs) {
      for (const account of accounts) {
        if (accountMatchesLeg(account, leg, accounts)) accountIds.add(account.id);
      }
    }
    if (!accountIds.size) continue;
    const allocatedProfit = Number(arb.profitUsd || 0) / accountIds.size;
    for (const id of accountIds) {
      const current = stats.get(id);
      current.count += 1;
      current.profitUsd += allocatedProfit;
    }
  }
  return stats;
}

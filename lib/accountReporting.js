export const REPORT_START_DATE = "2026-08-06";
export const REPORT_END_DATE = "2026-11-07";

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function canonicalBooker(value) {
  const key = normalize(value).replace(/(?:fallback|hedge)$/, "");
  if (key === "artlinebet") return "artline";
  if (key === "jackcom") return "jack";
  return key;
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
  return calculateAccountStats(accounts, getPeriodArbs(arbs));
}

export function getRecordedArbs(arbs) {
  return arbs.filter((arb) => arb.dateKey >= REPORT_START_DATE);
}

export function getRecordedReportEndDate(arbs) {
  return getRecordedArbs(arbs).reduce((latest, arb) =>
    arb.dateKey > latest ? arb.dateKey : latest, REPORT_START_DATE);
}

export function getRecordedAccountStats(accounts, arbs) {
  return calculateAccountStats(accounts, getRecordedArbs(arbs));
}

function calculateAccountStats(accounts, arbs) {
  const stats = new Map(accounts.map((account) => [account.id, { count: 0, profitUsd: 0 }]));
  for (const arb of arbs) {
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

export function getDailyAccountActivity(accounts, arbs, date) {
  const stats = new Map(accounts.map((account) => [account.id, {
    firstPlacedDate: null,
    placedCount: 0,
    stakes: new Map(),
    settledCount: 0,
    profitUsd: 0
  }]));
  const byPair = new Map(accounts.map((account) => [
    `${canonicalBooker(account.booker)}:${normalize(account.vps)}`, account
  ]));

  for (const arb of arbs) {
    if (arb.synthetic) continue;
    const placedDate = arb.placedDateKey || arb.dateKey;
    const participants = new Set();

    for (const leg of arb.legs) {
      if (leg.outcome === "not_placed" || leg.outcome === "missing") continue;
      const pair = `${canonicalBooker(leg.bookerBase || leg.booker)}:${normalize(leg.vps)}`;
      const account = leg.vps ? byPair.get(pair) : accounts.find((item) => accountMatchesLeg(item, leg, accounts));
      participants.add(account?.id || pair);
      if (!account || !(leg.stake > 0)) continue;

      const current = stats.get(account.id);
      if (leg.vps && /^\d{4}-\d{2}-\d{2}$/.test(placedDate) &&
          (!current.firstPlacedDate || placedDate < current.firstPlacedDate)) {
        current.firstPlacedDate = placedDate;
      }
      if (placedDate === date) {
        const currency = String(leg.currency || "MXN").toUpperCase();
        current.placedCount += 1;
        current.stakes.set(currency, (current.stakes.get(currency) || 0) + Number(leg.stake));
      }
    }

    if (arb.dateKey !== date || !participants.size) continue;
    const profitShare = Number(arb.profitUsd || 0) / participants.size;
    for (const id of participants) {
      const current = stats.get(id);
      if (!current) continue;
      current.settledCount += 1;
      current.profitUsd += profitShare;
    }
  }

  return stats;
}

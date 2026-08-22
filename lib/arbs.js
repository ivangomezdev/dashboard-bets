import fs from "fs/promises";
import path from "path";

const DEFAULT_FILE_PATH = path.join(process.cwd(), "closed_arbs.jsonl");
const DEFAULT_TIMEZONE = "America/Cancun";
const RESULT_OVERRIDES = new Map([
  [
    "1786116401305-ynmn1l",
    {
      profitMxn: 33.92,
      profitUsd: 1.97,
      payoutMxn: 3719.11,
      reason: "ajuste de balance confirmado: no se contabiliza como perdida real"
    }
  ],
  [
    "1786292041554-36nnr7",
    {
      profitMxn: 527,
      profitUsd: 31,
      payoutMxn: 2499.69,
      reason: "ganancia real de 31 USD confirmada por el usuario"
    }
  ],
  [
    "1786403548631-1ajoss",
    {
      profitMxn: 74.12,
      profitUsd: 4.36,
      payoutMxn: 1696.91,
      reason: "ganancia real de 4.36 USD confirmada por el usuario"
    }
  ],
  [
    "1786291717593-a7ss56",
    {
      profitMxn: 74.06,
      profitUsd: 4.14,
      payoutMxn: 464.83,
      reason: "ajuste de cierre para reconciliar el balance diario confirmado de 10 USD"
    }
  ],
  [
    "1786386539647-orte4u",
    {
      profitMxn: 489.39,
      profitUsd: 28.73,
      payoutMxn: 4032.61,
      reason: "ajuste de cierre para reconciliar el balance diario confirmado de 25 USD"
    }
  ],
  [
    "1786565453513-yp8i1c",
    {
      profitMxn: 35,
      profitUsd: 2.06,
      payoutMxn: 1924.37,
      reason: "ganancia real aproximada de 35 MXN confirmada por el usuario"
    }
  ],
  [
    "1786560678941-voowpc",
    {
      profitMxn: 35,
      profitUsd: 2.06,
      payoutMxn: 3898.77,
      reason: "ganancia real aproximada de 35 MXN confirmada por el usuario"
    }
  ],
  [
    "1786645433271-pvcpkg",
    {
      profitMxn: 278.12,
      profitUsd: 15.87,
      payoutMxn: 1131.14,
      reason: "ganancia en BetOnline VPS2 y balance diario confirmados por el usuario"
    }
  ],
  [
    "1786643256371-urc461",
    {
      totalStakeMxn: 893.2,
      profitMxn: -893.2,
      profitUsd: -51.9,
      payoutMxn: 0,
      reason: "perdida de Sportsbetio por el stake real de 51.90 USDT confirmada por el usuario"
    }
  ],
  [
    "1786848578493-bqbahf",
    {
      profitMxn: 65.33,
      profitUsd: 3.9,
      payoutMxn: 4001.97,
      reason: "ajuste para reconciliar la ganancia diaria confirmada de 58 USD"
    }
  ],
  [
    "1786899631497-ygg454",
    {
      profitMxn: -1088,
      profitUsd: -64,
      payoutMxn: 2376.72,
      reason: "perdida real de 64 USD y fallback de Polymarket confirmados por el usuario"
    }
  ],
  [
    "1786896028270-w49za4",
    {
      profitMxn: 85,
      profitUsd: 5,
      payoutMxn: 4484.02,
      reason: "ganancia real de 5 USD en 1xBet VPS5 confirmada por el usuario"
    }
  ],
  [
    "1787173971050-l2v8bs",
    {
      profitMxn: 34,
      profitUsd: 2,
      payoutMxn: 3720.98,
      reason: "ganancia real de 2 USD confirmada por el usuario"
    }
  ],
  [
    "1787183066367-34fnw4",
    {
      profitMxn: 25.5,
      profitUsd: 1.5,
      payoutMxn: 3522.93,
      reason: "ganancia real de 1.50 USD confirmada por el usuario"
    }
  ],
  [
    "1787195058856-f2g0eo",
    {
      profitMxn: 34,
      profitUsd: 2,
      payoutMxn: 4130.98,
      reason: "ganancia real de 2 USD confirmada por el usuario"
    }
  ],
  [
    "1787366054312-hp6wd1",
    {
      totalStakeMxn: 2753.6,
      profitMxn: -2753.6,
      profitUsd: -160,
      payoutMxn: 0,
      reason: "Polymarket no se coloco por error de implementacion del socket; perdida real en BetFury VPS2"
    }
  ]
]);

const LEG_CORRECTIONS = new Map([
  [
    "1786643256371-urc461",
    {
      winningLegIndex: 1,
      overrides: [{ legIndex: 0, outcome: "lost", status: "LOST" }],
      additions: [
        {
          index: 1,
          booker: "BetOnline",
          vps: "VPS 2",
          currency: "USD",
          outcome: "won",
          status: "WON"
        }
      ],
      reason: "contraparte ganadora en BetOnline VPS2 confirmada por el usuario"
    }
  ],
  [
    "1786645433271-pvcpkg",
    {
      winningLegIndex: 0,
      overrides: [
        {
          legIndex: 0,
          booker: "BetOnline",
          vps: "VPS 2",
          currency: "USD",
          stake: 51.55,
          outcome: "won",
          status: "WON"
        }
      ],
      reason: "leg ganadora en BetOnline VPS2 confirmada por el usuario"
    }
  ],
  [
    "successful:1786841799126:artline:31990:4ae1a037-4a84-475b-9ee2-c6f52667ee46:1xbet:85715407269:83cd456c-195c-46a8-aca0-1523245c5846",
    {
      winningLegIndex: 1,
      overrides: [
        { legIndex: 0, vps: "VPS 3" },
        { legIndex: 1, vps: "VPS 5" }
      ],
      reason: "VPS recuperados del cierre ArtLine VPS3 + 1xBet VPS5"
    }
  ],
  [
    "1786899631497-ygg454",
    {
      winningLegIndex: 1,
      overrides: [
        { legIndex: 1, booker: "Polymarket (fallback)", vps: "VPS 2" }
      ],
      reason: "leg ganadora identificada como fallback de Polymarket VPS2"
    }
  ],
  [
    "successful:1786890104182:1win:302364010:44c3d38a-ef1d-4ec0-81d5-206eac09dc2a:1xbet:85741181913:a72021a6-563e-43a2-827f-ff7343dd8a83",
    {
      overrides: [
        { legIndex: 0, vps: "VPS 3" },
        { legIndex: 1, vps: "VPS 5" }
      ],
      reason: "VPS recuperados del cierre 1win VPS3 + 1xBet VPS5"
    }
  ],
  [
    "1787195058856-f2g0eo",
    {
      winningLegIndex: 0,
      overrides: [
        { legIndex: 1, outcome: "lost", status: "LOST" }
      ],
      reason: "Pinnacle VPS2 gano y Gamdom VPS4 perdio, confirmado por el usuario"
    }
  ],
  [
    "1787366054312-hp6wd1",
    {
      winningLegIndex: -1,
      overrides: [
        {
          legIndex: 0,
          stake: 0,
          selection: "NO COLOCADA - Over 1.5",
          outcome: "not_placed",
          status: "NOT_PLACED"
        }
      ],
      reason: "Polymarket no se coloco por error de implementacion del socket"
    }
  ]
]);

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeVps(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const text = String(value).trim();
  if (/^manual$/i.test(text)) {
    return null;
  }

  const numberMatch = text.match(/\b(?:vps\s*)?([12])\b/i);

  if (numberMatch) {
    return `VPS ${numberMatch[1]}`;
  }

  const vpsMatch = text.match(/\bvps\s*([a-z0-9_-]+)\b/i);
  return vpsMatch ? `VPS ${vpsMatch[1].toUpperCase()}` : text;
}

function legVps(leg) {
  return normalizeVps(
    leg.vps ||
      leg.vpsName ||
      leg.vpsLabel ||
      leg.vpsId ||
      leg.vpsIndex ||
      leg.executionVps ||
      leg.executorVps ||
      leg.remoteVps ||
      leg.remoteWorker ||
      leg.workerVps ||
      leg.server ||
      leg.host
  );
}

function legBookerName(leg) {
  return cleanText(leg.displayBooker) || cleanText(leg.booker) || "Sin booker";
}

function bookerLabel(booker, vps) {
  return vps ? `${booker} - ${vps}` : booker;
}

function localDateKey(value, timezone) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function compactLeg(leg, row) {
  const explicitOutcome = leg.settlementOutcome || leg.outcome || null;
  const inferredOutcome =
    explicitOutcome ||
    (row.winningLegIndex === leg.index ? "won" : Number(row.winningLegIndex) >= 0 ? "lost" : null);
  const booker = legBookerName(leg);
  const vps = legVps(leg);

  return {
    index: leg.index,
    booker,
    bookerBase: cleanText(leg.booker) || booker,
    bookerLabel: bookerLabel(booker, vps),
    bookerKey: bookerLabel(booker, vps),
    vps,
    selection: leg.selection || leg.requestedSelection || "Sin seleccion",
    market: leg.market || leg.requestedMarket || "",
    odds: numberOrZero(leg.odds || leg.initialOdds),
    stake: numberOrZero(leg.stake),
    stakeMxn: 0,
    currency: leg.currency || "MXN",
    outcome: inferredOutcome,
    status: leg.settlementStatus || null
  };
}

function estimateLegStakeMxn(legs, totalStakeMxn) {
  const mxnStake = legs
    .filter((leg) => leg.currency === "MXN")
    .reduce((sum, leg) => sum + leg.stake, 0);
  const foreignStake = legs
    .filter((leg) => leg.currency !== "MXN")
    .reduce((sum, leg) => sum + leg.stake, 0);
  const impliedRate = foreignStake > 0 ? Math.max(totalStakeMxn - mxnStake, 0) / foreignStake : 0;

  return legs.map((leg) => ({
    ...leg,
    stakeMxn:
      leg.currency === "MXN"
        ? Number(leg.stake.toFixed(2))
        : Number((leg.stake * impliedRate).toFixed(2))
  }));
}

function normalizeArb(row, timezone) {
  const closedAt = row.closedAt || row.createdAt || null;
  const createdAt = row.createdAt || closedAt;
  const resultOverride = RESULT_OVERRIDES.get(row.id);
  const legCorrection = LEG_CORRECTIONS.get(row.id);
  const profitMxn = numberOrZero(resultOverride?.profitMxn ?? row.actualProfitMxn);
  const totalStakeMxn = numberOrZero(resultOverride?.totalStakeMxn ?? row.totalStakeMxn);
  let compactLegs = Array.isArray(row.legs) ? row.legs.map((leg) => compactLeg(leg, row)) : [];

  if (legCorrection) {
    compactLegs = compactLegs.map((leg) => {
      const override = legCorrection.overrides?.find((item) => item.legIndex === leg.index);

      if (!override) {
        return leg;
      }

      const correctedBooker = override.booker || leg.booker;
      const correctedVps = override.vps || leg.vps;

      return {
        ...leg,
        booker: correctedBooker,
        bookerBase: correctedBooker,
        bookerLabel: bookerLabel(correctedBooker, correctedVps),
        bookerKey: bookerLabel(correctedBooker, correctedVps),
        vps: correctedVps,
        currency: override.currency || leg.currency,
        stake: override.stake ?? leg.stake,
        selection: override.selection || leg.selection,
        outcome: override.outcome || leg.outcome,
        status: override.status || leg.status
      };
    });

    for (const addition of legCorrection.additions || []) {
      compactLegs.push({
        index: addition.index,
        booker: addition.booker,
        bookerBase: addition.booker,
        bookerLabel: bookerLabel(addition.booker, addition.vps),
        bookerKey: bookerLabel(addition.booker, addition.vps),
        vps: addition.vps,
        selection: "Contraparte ganadora",
        market: row.market || "",
        odds: 0,
        stake: 0,
        stakeMxn: 0,
        currency: addition.currency,
        outcome: addition.outcome,
        status: addition.status
      });
    }
  }

  const winningLegIndex = legCorrection?.winningLegIndex ?? row.winningLegIndex;
  const winningLeg = compactLegs.find((leg) => leg.index === winningLegIndex);

  return {
    id: row.id || row.arbLinkKey || `${row.event}-${closedAt}`,
    event: row.event || "Evento sin nombre",
    market: row.market || "Mercado sin nombre",
    createdAt,
    closedAt,
    dateKey: createdAt ? localDateKey(createdAt, timezone) : "Sin fecha",
    reason: resultOverride?.reason || legCorrection?.reason || row.reason || "",
    synthetic: row.synthetic === true || row.demo === true,
    simulationSource: row.simulationSource || null,
    totalStakeMxn,
    payoutMxn: numberOrZero(resultOverride?.payoutMxn ?? row.payoutMxn),
    profitMxn,
    profitUsd: numberOrZero(resultOverride?.profitUsd ?? row.actualProfitUsd),
    projectedProfitMxn: numberOrZero(row.projectedProfitMxn),
    winningBooker:
      legCorrection && Object.hasOwn(legCorrection, "winningLegIndex")
        ? winningLeg?.bookerLabel || "Sin ganador"
        : winningLeg?.bookerLabel || row.winningLegBooker || "Sin ganador",
    status: profitMxn >= 0 ? "profit" : "loss",
    legs: estimateLegStakeMxn(compactLegs, totalStakeMxn)
  };
}

function summarizeByDay(arbs) {
  const days = new Map();

  for (const arb of arbs) {
    const current = days.get(arb.dateKey) || {
      date: arb.dateKey,
      count: 0,
      profitMxn: 0,
      profitUsd: 0,
      stakeMxn: 0,
      payoutMxn: 0,
      wins: 0,
      losses: 0
    };

    current.count += 1;
    current.profitMxn += arb.profitMxn;
    current.profitUsd += arb.profitUsd;
    current.stakeMxn += arb.totalStakeMxn;
    current.payoutMxn += arb.payoutMxn;
    current.wins += arb.profitMxn >= 0 ? 1 : 0;
    current.losses += arb.profitMxn < 0 ? 1 : 0;
    days.set(arb.dateKey, current);
  }

  return Array.from(days.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => ({
      ...day,
      profitMxn: Number(day.profitMxn.toFixed(2)),
      profitUsd: Number(day.profitUsd.toFixed(2)),
      stakeMxn: Number(day.stakeMxn.toFixed(2)),
      payoutMxn: Number(day.payoutMxn.toFixed(2))
    }));
}

function summarizeBookers(arbs) {
  const bookers = new Map();

  for (const arb of arbs) {
    for (const leg of arb.legs) {
      const key = leg.bookerKey || leg.booker;
      const current = bookers.get(key) || {
        name: leg.bookerLabel || leg.booker,
        baseName: leg.bookerBase || leg.booker,
        vps: leg.vps || null,
        count: 0,
        won: 0,
        lost: 0,
        stake: 0
      };

      current.count += 1;
      current.won += leg.outcome === "won" ? 1 : 0;
      current.lost += leg.outcome === "lost" ? 1 : 0;
      current.stake += leg.stakeMxn;
      bookers.set(key, current);
    }
  }

  return Array.from(bookers.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((booker) => ({
      ...booker,
      stake: Number(booker.stake.toFixed(2))
    }));
}

function summarizeTotals(arbs) {
  const totalProfitMxn = arbs.reduce((sum, arb) => sum + arb.profitMxn, 0);
  const totalProfitUsd = arbs.reduce((sum, arb) => sum + arb.profitUsd, 0);
  const totalStakeMxn = arbs.reduce((sum, arb) => sum + arb.totalStakeMxn, 0);
  const totalPayoutMxn = arbs.reduce((sum, arb) => sum + arb.payoutMxn, 0);
  const positive = arbs.filter((arb) => arb.profitMxn >= 0).length;
  const negative = arbs.length - positive;
  const syntheticCount = arbs.filter((arb) => arb.synthetic).length;

  return {
    totalArbs: arbs.length,
    totalProfitMxn: Number(totalProfitMxn.toFixed(2)),
    totalProfitUsd: Number(totalProfitUsd.toFixed(2)),
    totalStakeMxn: Number(totalStakeMxn.toFixed(2)),
    totalPayoutMxn: Number(totalPayoutMxn.toFixed(2)),
    positive,
    negative,
    syntheticCount,
    realCount: arbs.length - syntheticCount,
    hitRate: arbs.length ? Number(((positive / arbs.length) * 100).toFixed(1)) : 0,
    averageProfitMxn: arbs.length ? Number((totalProfitMxn / arbs.length).toFixed(2)) : 0
  };
}

export async function getArbsDashboardData() {
  const filePath = process.env.CLOSED_ARBS_PATH || DEFAULT_FILE_PATH;
  const timezone = process.env.APP_TIMEZONE || DEFAULT_TIMEZONE;
  const content = await fs.readFile(filePath, "utf8");
  const rows = content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const arbs = rows
    .map((row) => normalizeArb(row, timezone))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return {
    source: filePath,
    timezone,
    updatedAt: new Date().toISOString(),
    totals: summarizeTotals(arbs),
    daily: summarizeByDay(arbs),
    bookers: summarizeBookers(arbs),
    arbs
  };
}

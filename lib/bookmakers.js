const BOOKMAKER_ICONS = [
  { match: ["1win"], icon: "1win.png" },
  { match: ["1xbit", "1x bit"], icon: "1xbit.png" },
  { match: ["1xbet", "1x bet"], icon: "1xbet.ico" },
  { match: ["888sport", "888 sport"], icon: "888sport.ico" },
  { match: ["artlinebet", "artline bet", "artline"], icon: "artline.png" },
  { match: ["bc.game", "bc game", "bcgame"], icon: "bc-game.ico" },
  { match: ["betdex"], icon: "betdex.png" },
  { match: ["betfury", "bet fury"], icon: "betfury.png" },
  { match: ["betonline", "bet online"], icon: "betonline.png" },
  { match: ["bookmakerxyz", "bookmaker xyz"], icon: "bookmakerxyz.ico" },
  { match: ["fortunejack", "fortune jack"], icon: "fortunejack.svg" },
  { match: ["jackbit", "jack bit"], icon: "jackbit.png" },
  { match: ["jack.com", "jack"], icon: "jack.png" },
  { match: ["cloudbet", "cloud bet"], icon: "cloudbet.ico" },
  { match: ["gamdom"], icon: "gamdom.png" },
  { match: ["kalshi"], icon: "kalshi.png" },
  { match: ["melbet", "mel bet"], icon: "melbet.png" },
  { match: ["pinnacle"], icon: "pinnacle.ico" },
  { match: ["pokerstars", "poker stars"], icon: "pokerstars.ico" },
  { match: ["polymarket", "poly market"], icon: "polymarket.png" },
  { match: ["sportsbetio", "sportsbet.io", "sportsbet io", "sports bet io"], icon: "sportsbetio.ico" },
  { match: ["shuffle"], icon: "shuffle.ico" },
  { match: ["vavada"], icon: "vavada.svg" }
];

function normalizeBookmakerName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getBookmakerIcon(name) {
  const normalized = normalizeBookmakerName(name);
  const found = BOOKMAKER_ICONS.find((bookmaker) =>
    bookmaker.match.some((value) => normalized.includes(value))
  );

  return found ? `/bookmakers/${found.icon}` : null;
}

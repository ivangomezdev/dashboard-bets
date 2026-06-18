const BOOKMAKER_ICONS = [
  { match: ["1xbet", "1x bet"], icon: "1xbet.ico" },
  { match: ["888sport", "888 sport"], icon: "888sport.ico" },
  { match: ["bc.game", "bc game", "bcgame"], icon: "bc-game.ico" },
  { match: ["bookmakerxyz", "bookmaker xyz"], icon: "bookmakerxyz.ico" },
  { match: ["pinnacle"], icon: "pinnacle.ico" },
  { match: ["pokerstars", "poker stars"], icon: "pokerstars.ico" },
  { match: ["sportsbetio", "sportsbet.io", "sportsbet io", "sports bet io"], icon: "sportsbetio.ico" },
  { match: ["shuffle"], icon: "shuffle.ico" }
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

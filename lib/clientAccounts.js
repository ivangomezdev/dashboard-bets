export const CLIENT_ACCOUNTS = [
  { vps: "VPS 1", booker: "PokerStars", status: "ON", balance: 124.66, currency: "USD" },
  { vps: "VPS 1", booker: "1win", status: "ON", balance: 100.03, currency: "USDT" },
  { vps: "VPS 1", booker: "Melbet", status: "ON", balance: 2.98, currency: "USD" },
  { vps: "VPS 1", booker: "BetFury", status: "ON", balance: 51.67, currency: "USDT" },
  { vps: "VPS 1", booker: "Gamdom", status: "ON", balance: 228.37, currency: "USD" },
  { vps: "VPS 2", booker: "Pinnacle", status: "ON", balance: 921.79, currency: "MXN" },
  { vps: "VPS 2", booker: "PokerStars", status: "ON", balance: 825.22, currency: "USD" },
  { vps: "VPS 2", booker: "BetFury", status: "ON", balance: 119, currency: "USD" },
  { vps: "VPS 2", booker: "Shuffle", status: "ON", balance: 3.07, currency: "USDT" },
  { vps: "VPS 2", booker: "Polymarket", status: "ON", balance: 37.86, currency: "USDT" },
  { vps: "VPS 2", booker: "Sportsbetio", status: "ON", balance: 111.35, currency: "USDT" },
  { vps: "VPS 2", booker: "Kalshi", status: "ON", balance: 60.59, currency: "USDT" },
  { vps: "VPS 2", booker: "ArtLine", status: "ON", balance: 92.22, currency: "USDT" },
  { vps: "VPS 2", booker: "Gamdom", status: "ON", balance: 41.27, currency: "USD" },
  { vps: "VPS 2", booker: "BC.Game", status: "ON", balance: 3097.53, currency: "MXN" },
  { vps: "VPS 2", booker: "Betdex", status: "ON", balance: 119.99, currency: "USD" },
  { vps: "VPS 2", booker: "Vavada", status: "ON", balance: 10, currency: "USD" },
  { vps: "VPS 2", booker: "BetOnline", status: "ON", balance: 39.82, currency: "USD" },
  { vps: "VPS 3", booker: "1win", status: "ON", balance: 251.18, currency: "USDT" },
  { vps: "VPS 3", booker: "Melbet", status: "ON", balance: 66.38, currency: "USDT" },
  { vps: "VPS 3", booker: "BetFury", status: "ON", balance: 47, currency: "USDT" },
  { vps: "VPS 3", booker: "Gamdom", status: "ON", balance: 74.6, currency: "USD" },
  { vps: "VPS 3", booker: "BetOnline", status: "ON", balance: 0, currency: "USD" },
  { vps: "VPS 3", booker: "ArtLine", status: "ON", balance: 101, currency: "USDT" },
  { vps: "VPS 4", booker: "1xBit", status: "ON", balance: 140.91, currency: "USDT" },
  { vps: "VPS 4", booker: "1win", status: "ON", balance: 233.33, currency: "USDT" },
  { vps: "VPS 4", booker: "Gamdom", status: "ON", balance: 97.4, currency: "USD" },
  { vps: "VPS 4", booker: "BC.Game", status: "ON", balance: 72.23, currency: "USD" },
  { vps: "VPS 2", booker: "Jackbit", status: "ON", balance: 116, currency: "USDT" }
].map((account) => ({
  ...account,
  id: `${account.vps}-${account.booker}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}));

export const ACTIVE_CLIENT_COUNT = CLIENT_ACCOUNTS.filter(
  (account) => account.status === "ON"
).length;

export const CLIENT_ACCOUNTS = [
  { vps: "VPS 1", booker: "PokerStars", status: "ON", balance: 124.66, currency: "USD" },
  { vps: "VPS 1", booker: "1win", status: "ON", balance: 127.01, currency: "USDT" },
  { vps: "VPS 1", booker: "Melbet", status: "ON", balance: 456, currency: "USD" },
  { vps: "VPS 1", booker: "BetFury", status: "ON", balance: 49.13, currency: "USDT" },
  { vps: "VPS 1", booker: "Gamdom", status: "ON", balance: 3.89, currency: "USD" },
  { vps: "VPS 2", booker: "Pinnacle", status: "ON", balance: 0, currency: "USD" },
  { vps: "VPS 2", booker: "PokerStars", status: "ON", balance: 450.36, currency: "USD" },
  { vps: "VPS 2", booker: "BetFury", status: "BLK", balance: 53, currency: "USDT" },
  { vps: "VPS 2", booker: "Shuffle", status: "ON", balance: 3.07, currency: "USDT" },
  { vps: "VPS 2", booker: "Polymarket", status: "ON", balance: 156.65, currency: "USDT" },
  { vps: "VPS 2", booker: "Sportsbetio", status: "ON", balance: 198.48, currency: "USDT" },
  { vps: "VPS 2", booker: "Kalshi", status: "ON", balance: 10.3, currency: "USDT" },
  { vps: "VPS 2", booker: "ArtLine", status: "ON", balance: 281.67, currency: "USDT" },
  { vps: "VPS 2", booker: "Gamdom", status: "ON", balance: 29.24, currency: "USD" },
  { vps: "VPS 2", booker: "BC.Game", status: "ON", balance: 123.52, currency: "USD" },
  { vps: "VPS 2", booker: "Betdex", status: "ON", balance: 119.99, currency: "USD" },
  { vps: "VPS 2", booker: "Vavada", status: "ON", balance: 0, currency: "USD" },
  { vps: "VPS 2", booker: "888sport", status: "ON", balance: 101, currency: "USD" },
  { vps: "VPS 2", booker: "BetOnline", status: "ON", balance: 39.82, currency: "USD" },
  { vps: "VPS 2", booker: "Cloudbet", status: "ON", balance: 124.58, currency: "USDT" },
  { vps: "VPS 3", booker: "1win", status: "ON", balance: 323.37, currency: "USDT" },
  { vps: "VPS 3", booker: "Melbet", status: "ON", balance: 66.38, currency: "USDT" },
  { vps: "VPS 3", booker: "BetFury", status: "ON", balance: 16.8, currency: "USDT" },
  { vps: "VPS 3", booker: "Gamdom", status: "ON", balance: 26.19, currency: "USD" },
  { vps: "VPS 3", booker: "BetOnline", status: "OFF", balance: 0, currency: "USD" },
  { vps: "VPS 3", booker: "ArtLine", status: "ON", balance: 33, currency: "USDT" },
  { vps: "VPS 4", booker: "1xBit", status: "ON", balance: 140.91, currency: "USDT" },
  { vps: "VPS 2", booker: "1xBit", status: "ON", balance: 31.98, currency: "USDT" },
  { vps: "VPS 4", booker: "1win", status: "ON", balance: 371.75, currency: "USDT" },
  { vps: "VPS 4", booker: "Gamdom", status: "ON", balance: 438.92, currency: "USD" },
  { vps: "VPS 4", booker: "BC.Game", status: "ON", balance: 72.23, currency: "USD" },
  { vps: "VPS 4", booker: "BetOnline", status: "ON", balance: 67, currency: "USD" },
  { vps: "VPS 4", booker: "Kalshi", status: "PRE MARKET", balance: 0, currency: "USDT" },
  { vps: "VPS 4", booker: "Polymarket", status: "PRE MARKET", balance: 0, currency: "USDT" },
  { vps: "VPS 4", booker: "SXBET", status: "PRE MARKET", balance: 0, currency: "USDT" },
  { vps: "VPS 2", booker: "Jackbit", status: "ON", balance: 62.79, currency: "USDT" }
].map((account) => ({
  ...account,
  id: `${account.vps}-${account.booker}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}));

export const ACTIVE_CLIENT_COUNT = CLIENT_ACCOUNTS.filter(
  (account) => account.status === "ON"
).length;

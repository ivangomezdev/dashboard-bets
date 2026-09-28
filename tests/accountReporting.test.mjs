import assert from "node:assert/strict";
import test from "node:test";
import { CLIENT_ACCOUNTS } from "../lib/clientAccounts.js";
import { getArbsDashboardData } from "../lib/arbs.js";
import { accountMatchesLeg, getAccountStats, getPeriodArbs, getReportEndDate } from "../lib/accountReporting.js";

test("excludes September 28 from activity, profit and report end date", () => {
  const account = { id: "jack-11", booker: "Jack", vps: "VPS 11", currency: "USDT" };
  const leg = { bookerBase: "jack", vps: "vps11", outcome: "won" };
  const arbs = [
    { dateKey: "2026-08-05", profitUsd: 100, legs: [leg] },
    { dateKey: "2026-09-25", profitUsd: 3, legs: [leg] },
    { dateKey: "2026-09-27", profitUsd: 2, legs: [leg] },
    { dateKey: "2026-09-28", profitUsd: 1000, legs: [leg] }
  ];
  assert.equal(getPeriodArbs(arbs).length, 2);
  assert.equal(getReportEndDate(arbs), "2026-09-27");
  assert.deepEqual(getAccountStats([account], arbs).get(account.id), { count: 2, profitUsd: 5 });
});

test("allocates once per participating account and excludes unplaced legs", () => {
  const accounts = [
    { id: "a", booker: "Jack", vps: "VPS 11" },
    { id: "b", booker: "Stake", vps: "VPS 10" },
    { id: "c", booker: "Pinnacle", vps: "VPS 2" }
  ];
  const stats = getAccountStats(accounts, [{ dateKey: "2026-09-25", profitUsd: 12, legs: [
    { bookerBase: "jack", vps: "vps11", outcome: "won" },
    { bookerBase: "jack fallback", vps: "VPS 11", outcome: "won" },
    { bookerBase: "stake", vps: "vps10", outcome: "lost" },
    { bookerBase: "pinnacle", vps: "vps2", outcome: "not_placed" }
  ] }]);
  assert.deepEqual(stats.get("a"), { count: 1, profitUsd: 6 });
  assert.deepEqual(stats.get("b"), { count: 1, profitUsd: 6 });
  assert.deepEqual(stats.get("c"), { count: 0, profitUsd: 0 });
});

test("does not guess a VPS when multiple accounts match", () => {
  const accounts = [
    { id: "a", booker: "Jack", vps: "VPS 8", currency: "USDT" },
    { id: "b", booker: "Jack", vps: "VPS 11", currency: "USDT" }
  ];
  const leg = { bookerBase: "jack", vps: null, currency: "USDT", outcome: "won" };
  assert.ok(accounts.every((a) => !accountMatchesLeg(a, leg, accounts)));
});

test("all recorded house/VPS pairs through September 27 have an account", async () => {
  const { arbs } = await getArbsDashboardData();
  assert.equal(new Set(CLIENT_ACCOUNTS.map((a) => a.id)).size, CLIENT_ACCOUNTS.length);
  for (const arb of getPeriodArbs(arbs)) {
    for (const leg of arb.legs) {
      if (!leg.vps || leg.outcome === "not_placed") continue;
      const matches = CLIENT_ACCOUNTS.filter((a) => accountMatchesLeg(a, leg, CLIENT_ACCOUNTS));
      assert.equal(matches.length, 1, `${arb.id}: ${leg.bookerBase} / ${leg.vps}`);
    }
  }
  const stats = getAccountStats(CLIENT_ACCOUNTS, arbs);
  const importedIds = new Set([
    "vps-2-rainbet", "vps-2-betpanda", "vps-3-artline", "vps-5-1xbet",
    "vps-9-stake", "vps-9-bc-game", "vps-9-sportsbetio", "vps-9-betfury",
    "vps-10-stake", "vps-10-bc-game", "vps-11-jack", "vps-2-fortunejack",
    "vps-3-rainbet", "vps-10-betfury", "vps-10-rainbet"
  ]);
  const added = CLIENT_ACCOUNTS.filter((a) => importedIds.has(a.id));
  assert.equal(added.length, 15);
  for (const account of added) {
    assert.equal(account.balance, null);
    if (["vps-3-rainbet", "vps-10-rainbet"].includes(account.id)) {
      assert.deepEqual(stats.get(account.id), { count: 0, profitUsd: 0 });
    } else {
      assert.ok(stats.get(account.id).count > 0, account.id);
    }
  }
  // Keep user-confirmed replicas on Jack VPS 11 linked to this account.
  const jack = added.find((a) => a.booker === "Jack" && a.vps === "VPS 11");
  assert.ok(getPeriodArbs(arbs).some((arb) => arb.event.includes("Picuiense") &&
    arb.legs.some((leg) => accountMatchesLeg(jack, leg, CLIENT_ACCOUNTS))));
});

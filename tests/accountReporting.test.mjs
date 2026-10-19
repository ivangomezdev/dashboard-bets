import assert from "node:assert/strict";
import test from "node:test";
import { CLIENT_ACCOUNTS } from "../lib/clientAccounts.js";
import { getArbsDashboardData } from "../lib/arbs.js";
import { accountMatchesLeg, getAccountStats, getPeriodArbs, getReportEndDate } from "../lib/accountReporting.js";

test("includes October 18 and excludes October 19 from activity, profit and report end date", () => {
  const account = { id: "jack-11", booker: "Jack", vps: "VPS 11", currency: "USDT" };
  const leg = { bookerBase: "jack", vps: "vps11", outcome: "won" };
  const arbs = [
    { dateKey: "2026-08-05", profitUsd: 100, legs: [leg] },
    { dateKey: "2026-09-25", profitUsd: 3, legs: [leg] },
    { dateKey: "2026-10-12", profitUsd: 2, legs: [leg] },
    { dateKey: "2026-10-13", profitUsd: 4, legs: [leg] },
    { dateKey: "2026-10-14", profitUsd: 5, legs: [leg] },
    { dateKey: "2026-10-15", profitUsd: 6, legs: [leg] },
    { dateKey: "2026-10-16", profitUsd: -8, legs: [leg] },
    { dateKey: "2026-10-17", profitUsd: 7, legs: [leg] },
    { dateKey: "2026-10-18", profitUsd: 8, legs: [leg] },
    { dateKey: "2026-10-19", profitUsd: 1000, legs: [leg] }
  ];
  assert.equal(getPeriodArbs(arbs).length, 8);
  assert.equal(getReportEndDate(arbs), "2026-10-18");
  assert.deepEqual(getAccountStats([account], arbs).get(account.id), { count: 8, profitUsd: 27 });
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

test("all recorded house/VPS pairs through October 15 have an account", async () => {
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

test("October 13 reconciles local profit, manual correction and six replicas", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find((row) => row.date === "2026-10-13");
  assert.equal(day.count, 26);
  assert.equal(day.profitMxn, 1191.47);
  assert.equal(day.profitUsd, 65.14);
  const records = arbs.filter((arb) => arb.dateKey === day.date);
  assert.equal(new Set(records.map((arb) => arb.id)).size, 26);
  assert.equal(records.filter((arb) => arb.id.startsWith("manual:")).length, 6);
  assert.equal(records.find((arb) => arb.event === "Orion FC - Independiente San Vicente").profitMxn, -18);
});

test("October 14 preserves 32 local closures and uses the confirmed USD daily total", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find((row) => row.date === "2026-10-14");
  assert.equal(day.count, 32);
  assert.equal(day.profitMxn, 1694.89);
  assert.equal(day.profitUsd, 101.95);
  const records = arbs.filter((arb) => arb.dateKey === day.date);
  assert.equal(new Set(records.map((arb) => arb.id)).size, 32);
  assert.equal(records.filter((arb) => arb.id.startsWith("manual:")).length, 10);
  assert.equal(records.find((arb) => arb.event.startsWith("Radunia Stezyca")).profitMxn, 70);
});

test("October 15 preserves 36 local closures and uses the confirmed USD daily total", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find((row) => row.date === "2026-10-15");
  assert.equal(day.count, 36);
  assert.equal(day.profitMxn, 1709.08);
  assert.equal(day.profitUsd, 104.41);
  const records = arbs.filter((arb) => arb.dateKey === day.date);
  assert.equal(new Set(records.map((arb) => arb.id)).size, 36);
  assert.equal(records.filter((arb) => arb.id.startsWith("manual:")).length, 10);
  assert.equal(records.find((arb) => arb.event === "TSG 1899 Hoffenheim - Besiktas").profitMxn, -57.02);
});

test("October 16 includes all closures and matches cancellation evidence to losing arbs", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find(row => row.date === "2026-10-16");
  assert.equal(day.count, 31);
  assert.equal(day.profitMxn, -1578.11);
  assert.equal(day.profitUsd, -85.49);
  const records = arbs.filter(arb => arb.dateKey === day.date);
  assert.equal(new Set(records.map(arb => arb.id)).size, 31);
  const proofs = records.filter(arb => arb.evidence.length);
  assert.equal(proofs.length, 3);
  assert.deepEqual(proofs.flatMap(arb => arb.evidence.map(e => e.ticket)).sort(), ["2275965032", "2275966935", "2275969646"]);
  for (const arb of proofs) {
    assert.ok(arb.profitMxn < 0);
    assert.equal(arb.legs.find(leg => leg.booker === "pinnacle").outcome, "void");
    assert.equal(arb.legs.find(leg => leg.booker === "jack").outcome, "lost");
    const { access } = await import("node:fs/promises");
    await access(new URL("../public" + arb.evidence[0].path, import.meta.url));
  }
});

test("October 17 uses the user-confirmed MXN total and recorded 18.46 exchange rate", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find(row => row.date === "2026-10-17");
  assert.equal(day.count, 52);
  assert.equal(day.profitMxn, 2000);
  assert.equal(day.profitUsd, 108.34);
  assert.equal(new Set(arbs.filter(arb => arb.dateKey === day.date).map(arb => arb.id)).size, 52);
});

test("October 18 uses confirmed profit and records the three payments once", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find(row => row.date === "2026-10-18");
  assert.equal(day.count, 42);
  assert.equal(day.profitMxn, 1984.68);
  assert.equal(day.profitUsd, 107.51);
  assert.equal(new Set(arbs.filter(arb => arb.dateKey === day.date).map(arb => arb.id)).size, 42);
  const { WITHDRAWALS } = await import("../lib/withdrawals.js");
  const ids = ["vps-invoice-1446754", "vps-invoice-1446755", "ivan-week-payment-2026-10-18"];
  const payments = WITHDRAWALS.filter(m => ids.includes(m.id));
  assert.equal(payments.length, 3);
  assert.equal(payments.reduce((sum, m) => sum + m.amount, 0), 216);
  const { access, readFile } = await import("node:fs/promises");
  for (const payment of payments) {
    assert.equal(payment.movementType, "Pago");
    assert.equal(payment.currency, "USD");
    if (payment.receiptPdf) {
      await access(new URL("../public" + payment.receiptPdf, import.meta.url));
      await access(new URL("../public" + payment.receiptImage, import.meta.url));
    }
  }
  const dashboard = await readFile(new URL("../components/Dashboard.js", import.meta.url), "utf8");
  assert.ok(dashboard.includes("CURRENT_BALANCE_USD = 10679.51;"));
});

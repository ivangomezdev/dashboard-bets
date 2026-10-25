import assert from "node:assert/strict";
import test from "node:test";
import { CLIENT_ACCOUNTS } from "../lib/clientAccounts.js";
import { getArbsDashboardData } from "../lib/arbs.js";
import { accountMatchesLeg, getAccountStats, getPeriodArbs, getReportEndDate } from "../lib/accountReporting.js";

test("includes October 24 and excludes October 25 from activity, profit and report end date", () => {
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
    { dateKey: "2026-10-19", profitUsd: 9, legs: [leg] },
    { dateKey: "2026-10-20", profitUsd: 10, legs: [leg] },
    { dateKey: "2026-10-21", profitUsd: 11, legs: [leg] },
    { dateKey: "2026-10-22", profitUsd: 12, legs: [leg] },
    { dateKey: "2026-10-23", profitUsd: 13, legs: [leg] },
    { dateKey: "2026-10-24", profitUsd: 14, legs: [leg] },
    { dateKey: "2026-10-25", profitUsd: 1000, legs: [leg] }
  ];
  assert.equal(getPeriodArbs(arbs).length, 14);
  assert.equal(getReportEndDate(arbs), "2026-10-24");
  assert.deepEqual(getAccountStats([account], arbs).get(account.id), { count: 14, profitUsd: 96 });
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
  const { access } = await import("node:fs/promises");
  for (const payment of payments) {
    assert.equal(payment.movementType, "Pago");
    assert.equal(payment.currency, "USD");
    if (payment.receiptPdf) {
      await access(new URL("../public" + payment.receiptPdf, import.meta.url));
      await access(new URL("../public" + payment.receiptImage, import.meta.url));
    }
  }
});

test("October 19 preserves 21 local closures and uses confirmed MXN profit", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find(row => row.date === "2026-10-19");
  assert.equal(day.count, 21);
  assert.equal(day.profitMxn, 1759);
  assert.equal(day.profitUsd, 95.29);
  const records = arbs.filter(arb => arb.dateKey === day.date);
  assert.equal(new Set(records.map(arb => arb.id)).size, 21);
  assert.equal(Number(records.reduce((sum, arb) => sum + arb.profitMxn, 0).toFixed(2)), 1759.91);
  assert.ok(getReportEndDate(arbs) >= day.date);
});

test("October 20 imports 37 local closures and converts the daily MXN total once", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find(row => row.date === "2026-10-20");
  assert.equal(day.count, 37);
  assert.equal(day.profitMxn, 1553.15);
  assert.equal(day.profitUsd, 84.14);
  const records = arbs.filter(arb => arb.dateKey === day.date);
  assert.equal(new Set(records.map(arb => arb.id)).size, 37);
  assert.equal(Number(records.reduce((sum, arb) => sum + arb.profitMxn, 0).toFixed(2)), day.profitMxn);
  assert.ok(getReportEndDate(arbs) >= day.date);
});

test("October 21 uses USD 87 for daily results and USD 66 only for the general balance", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find(row => row.date === "2026-10-21");
  const records = arbs.filter(arb => arb.dateKey === day.date);
  assert.equal(day.count, 39);
  assert.equal(new Set(records.map(arb => arb.id)).size, 39);
  const closedProfitMxn = Number(records.reduce((sum, arb) => sum + arb.profitMxn, 0).toFixed(2));
  assert.equal(closedProfitMxn, 1700.50);
  assert.equal(day.profitMxn, 1606.02);
  assert.equal(day.profitUsd, 87);
  assert.equal(Number((closedProfitMxn / 18.46).toFixed(2)), 92.12);
  assert.ok(getReportEndDate(arbs) >= day.date);

  const { WITHDRAWALS } = await import("../lib/withdrawals.js");
  const ids = ["mex-accounts-payment-2026-10-22", "vps-payment-2026-10-22"];
  const payments = WITHDRAWALS.filter(m => ids.includes(m.id));
  assert.equal(payments.length, 2);
  assert.deepEqual(payments.map(m => m.amount), [250, 29]);
  assert.ok(payments.every(m => m.movementType === "Pago" && m.currency === "USD" && m.date === "2026-10-22"));
  const balance = Number((10858.94 - payments.reduce((sum, m) => sum + m.amount, 0) + 66).toFixed(2));
  assert.equal(balance, 10645.94);

});


test("October 22 imports 34 closures with the recorded 18.63 rate and preserves prior daily totals", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find(row => row.date === "2026-10-22");
  const records = arbs.filter(arb => arb.dateKey === day.date);
  assert.equal(day.count, 34);
  assert.equal(new Set(records.map(arb => arb.id)).size, 34);
  assert.equal(day.profitMxn, 2134.25);
  assert.equal(day.profitUsd, 114.56);
  assert.equal(Number(records.reduce((sum, arb) => sum + arb.profitMxn, 0).toFixed(2)), day.profitMxn);
  const overnight = records.find(arb => arb.id === "1792639327377-zw7wji");
  assert.equal(overnight.event, "CS Cartagines - Olimpia Tegucigalpa");
  assert.equal(overnight.profitMxn, 0);
  assert.equal(daily.find(row => row.date === "2026-10-21").count, 39);
  assert.equal(daily.find(row => row.date === "2026-10-21").profitUsd, 87);
  assert.ok(getReportEndDate(arbs) >= day.date);

});


test("October 23 preserves 45 closures and uses the user-confirmed USD 113.06 total", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find(row => row.date === "2026-10-23");
  const records = arbs.filter(arb => arb.dateKey === day.date);
  assert.equal(day.count, 45);
  assert.equal(new Set(records.map(arb => arb.id)).size, 45);
  assert.equal(day.profitMxn, 2117.61);
  assert.equal(day.profitUsd, 113.06);
  assert.equal(Number(records.reduce((sum, arb) => sum + arb.profitMxn, 0).toFixed(2)), 2248.77);
  const overnight = records.find(arb => arb.id === "1792715693352-kim0u3");
  assert.equal(overnight.event, "UCV FC - Club Atletico Barinas");
  assert.equal(overnight.profitMxn, 61.63);
  assert.equal(daily.find(row => row.date === "2026-10-22").count, 34);
  assert.equal(daily.find(row => row.date === "2026-10-22").profitMxn, 2134.25);
  assert.ok(getReportEndDate(arbs) >= day.date);

});


test("October 24 imports 39 closures and uses the user-confirmed balance independently", async () => {
  const { arbs, daily } = await getArbsDashboardData();
  const day = daily.find(row => row.date === "2026-10-24");
  const records = arbs.filter(arb => arb.dateKey === day.date);
  assert.equal(day.count, 39);
  assert.equal(new Set(records.map(arb => arb.id)).size, 39);
  assert.equal(day.profitMxn, 2227.33);
  assert.equal(day.profitUsd, 119.17);
  assert.equal(Number(records.reduce((sum, arb) => sum + arb.profitMxn, 0).toFixed(2)), day.profitMxn);
  assert.equal(daily.find(row => row.date === "2026-10-23").profitUsd, 113.06);
  assert.equal(getReportEndDate(arbs), day.date);
  const { readFile } = await import("node:fs/promises");
  const dashboard = await readFile(new URL("../components/Dashboard.js", import.meta.url), "utf8");
  const balance = Number(dashboard.match(/const CURRENT_BALANCE_USD = ([\d.]+);/)[1]);
  assert.equal(balance, 10983.11);
  assert.notEqual(balance, Number((10873.56 + day.profitUsd).toFixed(2)));
});

import { randomUUID } from "node:crypto";
export function createUsage(db) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS ai_requests (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, day TEXT NOT NULL, month TEXT NOT NULL, cost_micro_usd INTEGER NOT NULL)",
  );
  function reserve(storeId) {
    const day = new Date().toISOString().slice(0, 10),
      month = day.slice(0, 7);
    const storeCount = db
      .prepare(
        "SELECT COUNT(*) AS count FROM ai_requests WHERE store_id=? AND day=?",
      )
      .get(storeId, day).count;
    const dayCount = db
      .prepare("SELECT COUNT(*) AS count FROM ai_requests WHERE day=?")
      .get(day).count;
    const spent = db
      .prepare(
        "SELECT COALESCE(SUM(cost_micro_usd),0) AS total FROM ai_requests WHERE month=?",
      )
      .get(month).total;
    if (storeCount >= 20 || dayCount >= 100 || spent + 50000 > 5000000) {
      const error = new Error(
        "The AI usage allowance has been reached. Catalog browsing remains available.",
      );
      error.status = 429;
      throw error;
    }
    const id = randomUUID();
    db.prepare("INSERT INTO ai_requests VALUES (?,?,?,?,?)").run(
      id,
      storeId,
      day,
      month,
      50000,
    );
    return id;
  }
  function settle(id, usage) {
    // gpt-4.1-mini standard rates: $0.40/M input and $1.60/M output.
    // Double the estimate as a conservative buffer; provider billing remains authoritative.
    if (
      Number.isSafeInteger(usage?.prompt_tokens) &&
      usage.prompt_tokens >= 0 &&
      Number.isSafeInteger(usage?.completion_tokens) &&
      usage.completion_tokens >= 0
    ) {
      const cost = Math.ceil(
        (usage.prompt_tokens * 0.4 + usage.completion_tokens * 1.6) * 2,
      );
      db.prepare("UPDATE ai_requests SET cost_micro_usd=? WHERE id=?").run(
        Math.max(1, cost),
        id,
      );
    }
  }
  function summary(storeId) {
    const month = new Date().toISOString().slice(0, 7);
    return {
      requests: db
        .prepare(
          "SELECT COUNT(*) AS count FROM ai_requests WHERE store_id=? AND month=?",
        )
        .get(storeId, month).count,
      platformEstimatedUSD: db
        .prepare(
          "SELECT COALESCE(SUM(cost_micro_usd),0)/1000000.0 AS total FROM ai_requests WHERE month=?",
        )
        .get(month).total,
      platformMonthlyBudgetUSD: 5,
      dailyStoreLimit: 20,
      dailyPlatformLimit: 100,
    };
  }
  return { reserve, settle, summary };
}

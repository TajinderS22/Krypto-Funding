import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import { challenges, adminsTable, purchases } from "./service/Drizzle/db/schema.js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const db = drizzle(process.env.DATABASE_URL!);

const anchorPrice = (value: number) => (value / 5000) * 2 - 0.01;

const drawdowns = [6, 8, 10, 12] as const;
const ddAdjustment: Record<number, number> = {
  6: -1.0,
  8: -0.5,
  10: 0,
  12: 0.5,
};

interface BaseValue {
  value: number;
  oneStep: string;
  twoStep: string;
}

interface PlanDef {
  title: string;
  value: number;
  steps: number;
  drawdown: number;
  dailyDrawdown: number;
  target: number;
  price: string;
}

const baseValues: BaseValue[] = [
  { value: 5000, oneStep: "5K Phoenix", twoStep: "5K Echo" },
  { value: 10000, oneStep: "10K Saber", twoStep: "10K Pulse" },
  { value: 25000, oneStep: "25K Oracle", twoStep: "25K Nexus" },
  { value: 50000, oneStep: "50K Titan", twoStep: "50K Forge" },
  { value: 100000, oneStep: "100K Legend", twoStep: "100K Crown" },
];

const plans: PlanDef[] = [];

for (const bv of baseValues) {
  for (const dd of drawdowns) {
    const base = anchorPrice(bv.value);
    const price = (base + ddAdjustment[dd]!).toFixed(2);
    const dailyDrawdown = dd / 2;
    plans.push({
      title: `${bv.oneStep} ${dd}%`,
      value: bv.value,
      steps: 1,
      drawdown: dd,
      dailyDrawdown,
      target: dd,
      price,
    });
    plans.push({
      title: `${bv.twoStep} ${dd}%`,
      value: bv.value,
      steps: 2,
      drawdown: dd,
      dailyDrawdown,
      target: dd,
      price,
    });
  }
}

const buildDescription = (plan: PlanDef) =>
  `${plan.steps}-step · ${plan.drawdown}% drawdown / ${plan.dailyDrawdown}% daily · ${plan.target}% target · $${plan.value.toLocaleString()} simulated account.`;

async function seed() {
  const [admin] = await db.select().from(adminsTable).limit(1);
  if (!admin) {
    console.error("No admin found. Create an admin first.");
    process.exit(1);
  }

  console.log("Syncing challenges (upsert by value + steps + drawdown)...");
  const existing = await db.select().from(challenges);
  const used = new Set<string>();

  let created = 0;
  let updated = 0;

  for (const plan of plans) {
    const match = existing.find(
      (c) =>
        c.value === plan.value &&
        c.steps === plan.steps &&
        c.drawdown === plan.drawdown &&
        !used.has(c.id)
    );

    const row = {
      title: plan.title,
      value: plan.value,
      price: plan.price,
      steps: plan.steps,
      drawdown: plan.drawdown,
      daily_drawdown: plan.dailyDrawdown,
      target: plan.target,
      description: buildDescription(plan),
      creator_id: admin.id,
    };

    if (match) {
      used.add(match.id);
      await db.update(challenges).set(row).where(eq(challenges.id, match.id));
      updated++;
    } else {
      await db.insert(challenges).values(row);
      created++;
    }
  }

  const leftover = existing.filter((c) => !used.has(c.id));
  let kept = 0;
  let removed = 0;

  for (const c of leftover) {
    const [ref] = await db
      .select({ id: purchases.id })
      .from(purchases)
      .where(eq(purchases.challenge_id, c.id))
      .limit(1);

    if (ref) {
      console.warn(
        `Keeping legacy challenge "${c.title}" (${c.id}) — referenced by purchases.`
      );
      kept++;
      continue;
    }

    await db.delete(challenges).where(eq(challenges.id, c.id));
    removed++;
  }

  console.log(
    `Done. created=${created} updated=${updated} legacyRemoved=${removed} legacyKept=${kept}`
  );

  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      distinctTitles: sql<number>`count(distinct title)::int`,
    })
    .from(challenges);

  if (!stats || stats.total !== stats.distinctTitles) {
    console.error(
      `Duplicate titles detected: total=${stats?.total} distinct=${stats?.distinctTitles}`
    );
    process.exit(1);
  }

  const [nullDaily] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(challenges)
    .where(sql`daily_drawdown is null`);

  if (nullDaily && nullDaily.n > 0) {
    console.error(`${nullDaily.n} challenges still have NULL daily_drawdown.`);
    process.exit(1);
  }

  console.log(
    `Verified: ${stats.total} challenges, ${stats.distinctTitles} unique titles, daily_drawdown populated.`
  );
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

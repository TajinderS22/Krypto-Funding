import { drizzle } from "drizzle-orm/neon-http";
import { challenges, adminsTable } from "./service/Drizzle/db/schema.js";
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
    plans.push({
      title: bv.oneStep,
      value: bv.value,
      steps: 1,
      drawdown: dd,
      target: dd,
      price,
    });
    plans.push({
      title: bv.twoStep,
      value: bv.value,
      steps: 2,
      drawdown: dd,
      target: dd,
      price,
    });
  }
}

async function seed() {
  console.log("Deleting all existing challenges...");
  await db.delete(challenges);

  const [admin] = await db.select().from(adminsTable).limit(1);
  if (!admin) {
    console.error("No admin found. Create an admin first.");
    process.exit(1);
  }


  for (const plan of plans) {
    const [created] = await db
      .insert(challenges)
      .values({
        title: plan.title,
        value: plan.value,
        price: plan.price,
        steps: plan.steps,
        drawdown: plan.drawdown,
        target: plan.target,
        description: `${plan.steps}-step · ${plan.drawdown}% drawdown · ${plan.target}% target · $${plan.value.toLocaleString()} simulated account.`,
        creator_id: admin.id,
      })
      .returning();
    if (!created) continue;

  }

  console.log(`\nDone! ${plans.length} challenges seeded.`);
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

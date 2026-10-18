import {
  bigint,
  integer,
  pgTable,
  varchar,
  jsonb,
  timestamp,
  real,
  uuid,
  numeric,
  text,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstname: varchar({ length: 255 }).notNull(),
  lastname: varchar({ length: 255 }),
  email: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 255 }).unique(),
  password: varchar({ length: 255 }).notNull(),
});

export const adminsTable = pgTable("admins", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstname: varchar({ length: 255 }).notNull(),
  lastname: varchar({ length: 255 }),
  email: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 255 }).unique(),
  password: varchar({ length: 255 }).notNull(),
});

export const challenges = pgTable("challenges", {
  id: uuid().defaultRandom().primaryKey(),
  creator_id: integer()
    .notNull()
    .references(() => adminsTable.id),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  steps: integer(),
  value: integer(),
  price: numeric({ precision: 10, scale: 2 }),
  drawdown: integer(),
  daily_drawdown: integer(),
  target: integer(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
});

export const challengeStatus = pgTable("challenge_status", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // all FK
  user_id: integer()
    .notNull()
    .references(() => usersTable.id),
  challenge_id: uuid()
    .notNull()
    .references(() => challenges.id),
  purchase_id: integer()
    .notNull()
    .references(() => purchases.id),
  certificate_id: uuid().references(() => passCertificate.id),
  order_id: uuid().references(() => orders.id),
  discount_tracker_id: uuid().references(() => discountTracker.id),

  current_step: integer(),
  steps: integer(),

  status: varchar({ length: 50 }).notNull().default("active"),
  has_api_key: boolean().notNull().default(false),

  // action states
  fully_passed: boolean().notNull().default(false),
  passed_step_1: boolean().notNull().default(false),
  passed_step_2: boolean().notNull().default(false),
  failed: boolean().notNull().default(false),

  // action timing
  fully_passed_at: timestamp({ withTimezone: true }),
  passed_step_1_at: timestamp({ withTimezone: true }),
  passed_step_2_at: timestamp({ withTimezone: true }),
  failed_at: timestamp({ withTimezone: true }),

  value: integer().notNull(),
  current_balance: numeric({ precision: 20, scale: 8 }),
  failed_reason_code: varchar({ length: 50 }),
  failed_reason: varchar({ length: 255 }),

  updated_at: timestamp({ withTimezone: true }).defaultNow(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer()
    .notNull()
    .references(() => usersTable.id),
  challenge_id: uuid()
    .notNull()
    .references(() => challenges.id),
  final_amount: numeric({ precision: 10, scale: 2 }),
  order_id: uuid().references(() => orders.id),
  discount_tracker_id: uuid().references(() => discountTracker.id),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
  purchase_date: timestamp({ withTimezone: true }).defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid().primaryKey().defaultRandom(),
  user_id: integer().references(() => usersTable.id),
  challenge_id: uuid().references(() => challenges.id),
  idempotency_key: uuid().unique(),
  discount_code: varchar({ length: 255 }),
  discount_tracker_id: uuid().references(() => discountTracker.id),
  final_price: numeric({ precision: 10, scale: 2 }).notNull(),
  discount_applied: boolean(),
  pg_order_id: varchar().unique().notNull(),
  pg_status: varchar(),
  amount_due: numeric({ precision: 10, scale: 2 }),
  amount_paid: numeric({ precision: 10, scale: 2 }),
  attempts: integer(),
  currency: varchar().default("INR"),
  entity: varchar().default("order"),
  pg_payment_id: varchar(),
  pg_signature: varchar(),
  discount: numeric({ precision: 10, scale: 2 }),
  discount_percentage: numeric({ precision: 10, scale: 2 }),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
});

export const discountTracker = pgTable("discountTracker", {
  id: uuid().defaultRandom().primaryKey(),
  user_id: integer().references(() => usersTable.id),
  challenge_id: uuid().references(() => challenges.id),
  idempotency_key: uuid().unique(),
  discount_code: varchar({ length: 255 }),
  challenge_fee_final: numeric({ precision: 10, scale: 2 }),
  platform_fee: numeric({ precision: 10, scale: 2 }),
  gst_final: numeric({ precision: 10, scale: 2 }),
  gst_discount_final: numeric({ precision: 10, scale: 2 }),
  final_price: numeric({ precision: 10, scale: 2 }),
  discount_applied: boolean(),
  challenge_fee_actual: numeric({ precision: 10, scale: 2 }),
  gst_actual: numeric({ precision: 10, scale: 2 }),
  gst_discount_actual: numeric({ precision: 10, scale: 2 }),
  total_discount: numeric({ precision: 10, scale: 2 }),
  discount_percentage: numeric({ precision: 10, scale: 2 }),
});

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid().defaultRandom().primaryKey(),
    user_id: integer()
      .notNull()
      .references(() => usersTable.id),
    challenge_id: uuid()
      .notNull()
      .references(() => challenges.id),
    purchase_id: integer()
      .notNull()
      .references(() => purchases.id),
    current_step: integer().notNull().default(1),
    encrypted_api_key_credentials: text().notNull(),
    iv: text().notNull(),
    auth_tag: text().notNull(),
    key_version: integer().default(1),
    created_at: timestamp().defaultNow(),
  },
  (table) => [
    unique("purchase_step_unique").on(table.purchase_id, table.current_step),
  ],
);

export const dailySnapshot = pgTable("dailySnapshot", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  user_id: integer()
    .notNull()
    .references(() => usersTable.id),
  purchase_id: integer()
    .notNull()
    .references(() => purchases.id),
  challenge_status_id: integer().references(() => challengeStatus.id),
  account_balance: numeric({ precision: 10, scale: 2 }),
  current_step: integer().default(1),
  win_rate: numeric({ precision: 10, scale: 2 }),
  profit_factor: numeric({ precision: 10, scale: 2 }),
  closed_trades: jsonb("closed_trades").$type<Record<string, unknown>[]>(),

  updated_at: timestamp({ withTimezone: true }).defaultNow(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
});

export const exchangeData = pgTable("exchangeData", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer()
    .notNull()
    .references(() => usersTable.id),
  purchase_id: integer()
    .notNull()
    .references(() => purchases.id),
  challenge_id: uuid().references(() => challenges.id),
  current_step: integer().notNull().default(1),
  win_rate: numeric({ precision: 10, scale: 2 }),
  profit_factor: numeric({ precision: 10, scale: 2 }),
  closed_trades: jsonb("closed_trades").$type<Record<string, unknown>[]>(),
  starting_balance: numeric({ precision: 20, scale: 8 }),
  starting_at: bigint({ mode: "number" }),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
});

export const passCertificate = pgTable("passCertificate", {
  id: uuid().defaultRandom().primaryKey(),
  user_id: integer()
    .notNull()
    .references(() => usersTable.id),
  purchase_id: integer()
    .notNull()
    .references(() => purchases.id),
  //   challenge_status_id: integer()
  //     .notNull()
  //     .references(() => challengeStatus.id),
  exchange_data_id: integer().references(() => exchangeData.id),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
});

import { integer, pgTable, varchar, jsonb, timestamp, real, uuid, numeric, text, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstname: varchar({ length: 255 }).notNull(),
  lastname: varchar({length:255}),
  email: varchar({ length: 255 }).notNull().unique(),
  username:varchar({length:255}).unique(),
  password:varchar({length:255}).notNull()  
});


export const adminsTable = pgTable("admins", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstname: varchar({ length: 255 }).notNull(),
  lastname: varchar({length:255}),
  email: varchar({ length: 255 }).notNull().unique(),
  username:varchar({length:255}).unique(),
  password:varchar({length:255}).notNull()  
});




export const challanges = pgTable("challenges", {
  id: uuid().defaultRandom().primaryKey(),
  creator_id: integer().notNull().references(() => adminsTable.id),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  steps: integer(),
  value: integer(),
  price: numeric({ precision: 10, scale: 2 }),
  drawdown: integer(),
  target: integer(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
});


export const challengeStatus = pgTable("challenge_status",{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer().notNull().references(()=> usersTable.id),
  currentStepStatus: integer(),
  steps: integer(),
  challenge_id: uuid().notNull().references(()=> challanges.id),
  status: varchar({length:50}).notNull(),
  passed: boolean().notNull(),
  has_api_key: boolean().notNull().default(false),
  passed_at: timestamp({ withTimezone: true }),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
});


export const purchases= pgTable("purchases",{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer().notNull().references(()=> usersTable.id),
  challenge_id: uuid().notNull().references(()=> challanges.id),
  purchase_date: timestamp({ withTimezone: true }).defaultNow(),
})


export const  apiKeys = pgTable("api_keys",{
  id: uuid().defaultRandom().primaryKey(),
  user_id: integer().notNull().references(()=> usersTable.id),
  challenge_id: uuid().notNull().references(()=>challanges.id),
  pruchase_id: integer().notNull().references(()=>purchases.id),
  encrypted_api_key_credentials: text().notNull(),
  iv: text().notNull(),
  auth_tag: text().notNull(),
  key_version: integer().default(1),
  created_at: timestamp().defaultNow()
})


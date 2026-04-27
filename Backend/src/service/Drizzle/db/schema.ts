import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstname: varchar({ length: 255 }).notNull(),
  lastname: varchar({length:255}),
  email: varchar({ length: 255 }).notNull().unique(),
  username:varchar({length:255}).unique(),
  password:varchar({length:255}).notNull()  
});

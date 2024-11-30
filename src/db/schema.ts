import { relations } from "drizzle-orm";
import { blob, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {v4 as uuidv4} from "uuid";

// TODO: move to network domain
const supportedNetworks = [
  'evm',
  'solana',
  'tron',
] as const;

const tableId = () => text('id').primaryKey().$defaultFn(() => uuidv4());
export const usersTable = sqliteTable("users_table", {
  id: tableId(),
  email: text().notNull().unique(),
  username: text().default('').unique(),
  createAt: text('created_at').default(new Date().toISOString()),
});

export const accountTable = sqliteTable('wallets_table', {
  id: tableId(),
  userId: text('user_id').notNull().references(() => usersTable.id),
  networkType: text('network_type', { enum: supportedNetworks }).notNull(),
  shareA: blob('share_a'),
  shareB: blob('share_b'),
  shareC: blob('share_c'),
});


// -------------- RELATIONSHIPS ----------------
export const userRelations = relations(usersTable, ({ many }) => ({
  accounts: many(accountTable)
}));

export const accountRelations = relations(accountTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [accountTable.userId],
    references: [usersTable.id],
  })
}))

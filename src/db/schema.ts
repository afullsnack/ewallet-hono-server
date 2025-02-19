import { relations } from "drizzle-orm";
import { customType, pgTable, text, boolean } from "drizzle-orm/pg-core";
import {v4 as uuidv4} from "uuid";

// TODO: move to network domain
const supportedNetworks = [
  'evm',
  'solana',
  'tron',
] as const;
const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return "bytea";
  },
});

const tableId = () => text('id').primaryKey().$defaultFn(() => uuidv4());
export const usersTable = pgTable("users_table", {
  id: tableId(),
  email: text().notNull().unique(),
  username: text().default('').unique(),
  createAt: text('created_at').default(new Date().toISOString()),
  logtoUserId: text().notNull().unique(),
  metadata: text(),
  isFullyOnboarded: boolean().default(false),
});

export const accountTable = pgTable('wallets_table', {
  id: tableId(),
  userId: text('user_id').notNull().references(() => usersTable.id),
  networkType: text('network_type', { enum: supportedNetworks }).notNull(),
  shareA: bytea('share_a'),
  shareB: bytea('share_b'),
  shareC: bytea('share_c'),
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

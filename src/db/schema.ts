import { relations } from "drizzle-orm";
import { customType, pgTable, text, boolean, json, timestamp, integer } from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

// TODO: move to network domain
const supportedNetworks = [
  'evm',
  'btc',
  'solana',
  'tron',
] as const;
const guardianRequestStatus = [
  'accepted',
  'canceled',
  'pending',
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
  createAt: timestamp('created_at', { mode: 'string', withTimezone: true }).defaultNow().notNull(),
  logtoUserId: text().notNull().unique(),
  metadata: json(), // will hold a json array of custom networks and token data
  isFullyOnboarded: boolean().default(false),
});

export const accountTable = pgTable('wallets_table', {
  id: tableId(),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  network: text('network_type', { enum: supportedNetworks }).notNull(),
  address: text(),
  mnemonic: text().notNull(),
  shareA: bytea('share_a'), // our db only stores share_a
  shareB: bytea('share_b'), // sits on users device
  shareC: bytea('share_c'), // backup - QR Code or Guardian
  isBackedUp: boolean().default(false),
  // reference user as guardian, and set delete action to null when user is deleted
  guardianId: text('guardian_id').references(() => usersTable.id, { onDelete: 'set null' }),
  recoveryPassword: text(),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: false }).defaultNow().notNull(),
});

// guard request
export const guardRequestTable = pgTable('guard_request', {
  id: tableId(),
  guardianId: text('guardian_id').references(() => usersTable.id, { onDelete: 'set null' }),
  requestorId: text('requestor_id').references(() => usersTable.id, { onDelete: 'set null' }),
  status: text('status', { enum: guardianRequestStatus }).default('pending').notNull(),
});

export const recoveryRequestTable = pgTable('recovery_request', {
  id: tableId(),
  expiresIn: timestamp('expires_in', { mode: 'string', withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: false }).defaultNow().notNull(),
  requestorId: text('requestor_id').references(() => usersTable.id, { onDelete: 'cascade' }),
});


// -------------- RELATIONSHIPS ----------------
export const userRelations = relations(usersTable, ({ many }) => ({
  accounts: many(accountTable),
}));

export const accountRelations = relations(accountTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [accountTable.userId],
    references: [usersTable.id],
  })
}));

export const guardRequestRelations = relations(guardRequestTable, ({ one }) => ({
  guardian: one(usersTable, {
    fields: [guardRequestTable.guardianId],
    references: [usersTable.id]
  }),
  requestor: one(usersTable, {
    fields: [guardRequestTable.requestorId],
    references: [usersTable.id],
    relationName: 'requestor'
  })
}));

export const recoveryRequestRelations = relations(recoveryRequestTable, ({ one }) => ({
  requestor: one(usersTable, {
    fields: [recoveryRequestTable.requestorId],
    references: [usersTable.id]
  })
}));

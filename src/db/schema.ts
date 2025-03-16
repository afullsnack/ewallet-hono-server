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
export const user = pgTable("users", {
  id: tableId(),
  email: text().notNull().unique(),
  name: text('name'),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  username: text().unique(),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true }).defaultNow().$onUpdateFn(() => new Date(Date.now()).toISOString()),
  metadata: json(), // will hold a json array of custom networks and token data
  isFullyOnboarded: boolean().default(false),
});

export const wallet = pgTable('wallets', {
  id: tableId(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  network: text('network_type', { enum: supportedNetworks }).notNull(),
  address: text(),
  mnemonic: text().notNull(),
  shareA: text('share_a'), // our db only stores share_a
  shareB: text('share_b'), // sits on users device
  shareC: text('share_c'), // backup - QR Code or Guardian
  isBackedUp: boolean().default(false),
  // reference user as guardian, and set delete action to null when user is deleted
  guardianId: text('guardian_id').references(() => user.id, { onDelete: 'set null' }),
  recoveryPassword: text(),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: false }).defaultNow().notNull(),
});

// guard request
export const guardRequestTable = pgTable('guard_request', {
  id: tableId(),
  guardianId: text('guardian_id').references(() => user.id, { onDelete: 'set null' }),
  requestorId: text('requestor_id').references(() => user.id, { onDelete: 'set null' }),
  status: text('status', { enum: guardianRequestStatus }).default('pending').notNull(),
});

export const recoveryRequestTable = pgTable('recovery_request', {
  id: tableId(),
  expiresIn: timestamp('expires_in', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
  requestorId: text('requestor_id').references(() => user.id, { onDelete: 'cascade' }),
  keyData: text()
});

export const session = pgTable("session", {
  id: tableId(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
  id: tableId(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
  id: tableId(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

// -------------- RELATIONSHIPS ----------------
export const userRelations = relations(user, ({ many }) => ({
  wallets: many(wallet),
}));

export const walletRelation = relations(wallet, ({ one }) => ({
  user: one(user, {
    fields: [wallet.userId],
    references: [user.id],
  })
}));

export const guardRequestRelations = relations(guardRequestTable, ({ one }) => ({
  guardian: one(user, {
    fields: [guardRequestTable.guardianId],
    references: [user.id]
  }),
  requestor: one(user, {
    fields: [guardRequestTable.requestorId],
    references: [user.id],
    relationName: 'requestor'
  })
}));

export const recoveryRequestRelations = relations(recoveryRequestTable, ({ one }) => ({
  requestor: one(user, {
    fields: [recoveryRequestTable.requestorId],
    references: [user.id]
  })
}));

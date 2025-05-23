import { relations } from "drizzle-orm";
import { customType, pgTable, text, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { defaultNativeTokens, defaultUSDCTokens, defaultUSDTTokens } from "src/_lib/utils";
import { v4 as uuidv4 } from "uuid";

/// TODO: split file into various schema files with handlers/repo files on the same level
const supportedNetworks = [
  'evm',
  'btc',
  'solana',
  'tron',
] as const;
const transactionStatus = [
  'initiated',
  'pending',
  'complete',
  'failed'
] as const;
const transactionType = [
  'transfer',
  'received',
  'swap',
  'sell',
  'buy'
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
  isFullyOnboarded: boolean().default(false),
});

export const wallet = pgTable('wallets', {
  id: tableId(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  network: text('network_type', { enum: supportedNetworks }).notNull(),
  tokens: json().default(defaultNativeTokens.concat(defaultUSDCTokens, defaultUSDTTokens)), // will be an array of token objects with {address, symbol, name, chain}
  chainId: text().default('84532'),
  chainLogo: text(),
  address: text(),
  privateKey: text(),
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

// keypairs table
// wallets link to keypairs
// wallets can have multi keypairs from different networks
// export const keypair = pgTable('keypair', {
//   id: tableId(),
//   walletId: text('wallet_id').notNull().references(() => wallet.id, {onDelete: 'cascade'}),
//   privateKey: text(),
//   forNetwork: text('network', { enum: supportedNetworks }),
//   shareA: text(),
//   shareB: text(),
//   sharec: text(),
//   address: text(),
//   mnemonic: text().notNull(),
//   createdAt: timestamp('created_at', {mode: 'date', withTimezone: false }).defaultNow().notNull(),
// })

// tokens can be added to wallets
// different wallets can hold different tokens
export const tokens = pgTable('tokens', {
  id: tableId(),
  cgId: text()
})

export const transaction = pgTable('transaction', {
  id: tableId(),
  network: text('network_type', { enum: supportedNetworks }).notNull(),
  chainId: text(),
  amount: text('amount'),
  token: text(),
  type: text({enum: transactionType}).default('transfer'),
  status: text('status', { enum: transactionStatus}).notNull().default('initiated'),
  hash: text(),
  userId: text().references(() => user.id),
  sender: text().references(() => user.id),
  receiver: text(),
  fee: text(),
  feePaidBy: text(),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
})

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

export const walletRelation = relations(wallet, ({ one, many }) => ({
  user: one(user, {
    fields: [wallet.userId],
    references: [user.id],
    relationName: 'user'
  }),
  // guardian: one(user, {
  //   fields: [wallet.guardianId],
  //   references: [user.id],
  //   relationName: 'guardian'
  // })
  // keypairs: many(keypair)
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

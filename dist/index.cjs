"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_config2 = require("dotenv/config");
var import_node_server = require("@hono/node-server");

// src/router.ts
var import_cors = require("hono/cors");

// src/middlewares/logger.ts
var import_factory = require("hono/factory");
var import_pino = require("pino");
var logger = (0, import_pino.pino)({
  base: void 0,
  // level: "info",
  messageKey: "msg",
  redact: {
    paths: ["user.email", "user.password", "user.name", "user.phone", "password", "email"],
    censor: "[\u{1F47B}]"
  }
});
var honoLogger = (0, import_factory.createMiddleware)(async (c, next) => {
  const start = Date.now();
  await next();
  const responseTime = Date.now() - start;
  logger.info(
    {
      method: `${c.req.method}`,
      path: `${c.req.url}`,
      status: `${c.res.status}`,
      response_time: `${responseTime}ms`
    }
  );
});

// src/middlewares/panic.ts
var import_factory2 = require("hono/factory");
var panicLogger = (0, import_factory2.createMiddleware)(async (c, next) => {
  try {
    await next();
  } catch (err) {
    logger.error(err);
    const res = {
      success: false,
      code: 500,
      message: "Internal Server Error"
    };
    return c.json(res);
  }
});

// src/router.ts
var import_pretty_json = require("hono/pretty-json");

// src/handlers/health.ts
async function healthCheck(c) {
  const resp = {
    ok: true
  };
  return c.json(resp);
}

// src/router.ts
var import_dev = require("hono/dev");

// src/app.ts
var import_factory3 = require("hono/factory");

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  account: () => account,
  guardRequestRelations: () => guardRequestRelations,
  guardRequestTable: () => guardRequestTable,
  recoveryRequestRelations: () => recoveryRequestRelations,
  recoveryRequestTable: () => recoveryRequestTable,
  session: () => session,
  user: () => user,
  userRelations: () => userRelations,
  verification: () => verification,
  wallet: () => wallet,
  walletRelation: () => walletRelation
});
var import_drizzle_orm = require("drizzle-orm");
var import_pg_core = require("drizzle-orm/pg-core");
var import_uuid = require("uuid");
var supportedNetworks = [
  "evm",
  "btc",
  "solana",
  "tron"
];
var guardianRequestStatus = [
  "accepted",
  "canceled",
  "pending"
];
var bytea = (0, import_pg_core.customType)({
  dataType() {
    return "bytea";
  }
});
var tableId = () => (0, import_pg_core.text)("id").primaryKey().$defaultFn(() => (0, import_uuid.v4)());
var user = (0, import_pg_core.pgTable)("users", {
  id: tableId(),
  email: (0, import_pg_core.text)().notNull().unique(),
  name: (0, import_pg_core.text)("name"),
  emailVerified: (0, import_pg_core.boolean)("email_verified").notNull(),
  image: (0, import_pg_core.text)("image"),
  username: (0, import_pg_core.text)().unique(),
  createdAt: (0, import_pg_core.timestamp)("created_at", { mode: "string", withTimezone: true }).defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { mode: "string", withTimezone: true }).defaultNow().$onUpdateFn(() => new Date(Date.now()).toISOString()),
  metadata: (0, import_pg_core.json)(),
  // will hold a json array of custom networks and token data
  isFullyOnboarded: (0, import_pg_core.boolean)().default(false)
});
var wallet = (0, import_pg_core.pgTable)("wallets", {
  id: tableId(),
  userId: (0, import_pg_core.text)("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  network: (0, import_pg_core.text)("network_type", { enum: supportedNetworks }).notNull(),
  address: (0, import_pg_core.text)(),
  mnemonic: (0, import_pg_core.text)().notNull(),
  shareA: bytea("share_a"),
  // our db only stores share_a
  shareB: bytea("share_b"),
  // sits on users device
  shareC: bytea("share_c"),
  // backup - QR Code or Guardian
  isBackedUp: (0, import_pg_core.boolean)().default(false),
  // reference user as guardian, and set delete action to null when user is deleted
  guardianId: (0, import_pg_core.text)("guardian_id").references(() => user.id, { onDelete: "set null" }),
  recoveryPassword: (0, import_pg_core.text)(),
  createdAt: (0, import_pg_core.timestamp)("created_at", { mode: "string", withTimezone: false }).defaultNow().notNull()
});
var guardRequestTable = (0, import_pg_core.pgTable)("guard_request", {
  id: tableId(),
  guardianId: (0, import_pg_core.text)("guardian_id").references(() => user.id, { onDelete: "set null" }),
  requestorId: (0, import_pg_core.text)("requestor_id").references(() => user.id, { onDelete: "set null" }),
  status: (0, import_pg_core.text)("status", { enum: guardianRequestStatus }).default("pending").notNull()
});
var recoveryRequestTable = (0, import_pg_core.pgTable)("recovery_request", {
  id: tableId(),
  expiresIn: (0, import_pg_core.timestamp)("expires_in", { mode: "string", withTimezone: true }).notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at", { mode: "string", withTimezone: false }).defaultNow().notNull(),
  requestorId: (0, import_pg_core.text)("requestor_id").references(() => user.id, { onDelete: "cascade" })
});
var session = (0, import_pg_core.pgTable)("session", {
  id: tableId(),
  expiresAt: (0, import_pg_core.timestamp)("expires_at").notNull(),
  token: (0, import_pg_core.text)("token").notNull().unique(),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").notNull(),
  ipAddress: (0, import_pg_core.text)("ip_address"),
  userAgent: (0, import_pg_core.text)("user_agent"),
  userId: (0, import_pg_core.text)("user_id").notNull().references(() => user.id, { onDelete: "cascade" })
});
var account = (0, import_pg_core.pgTable)("account", {
  id: tableId(),
  accountId: (0, import_pg_core.text)("account_id").notNull(),
  providerId: (0, import_pg_core.text)("provider_id").notNull(),
  userId: (0, import_pg_core.text)("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: (0, import_pg_core.text)("access_token"),
  refreshToken: (0, import_pg_core.text)("refresh_token"),
  idToken: (0, import_pg_core.text)("id_token"),
  accessTokenExpiresAt: (0, import_pg_core.timestamp)("access_token_expires_at"),
  refreshTokenExpiresAt: (0, import_pg_core.timestamp)("refresh_token_expires_at"),
  scope: (0, import_pg_core.text)("scope"),
  password: (0, import_pg_core.text)("password"),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").notNull()
});
var verification = (0, import_pg_core.pgTable)("verification", {
  id: tableId(),
  identifier: (0, import_pg_core.text)("identifier").notNull(),
  value: (0, import_pg_core.text)("value").notNull(),
  expiresAt: (0, import_pg_core.timestamp)("expires_at").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at"),
  updatedAt: (0, import_pg_core.timestamp)("updated_at")
});
var userRelations = (0, import_drizzle_orm.relations)(user, ({ many }) => ({
  wallets: many(wallet)
}));
var walletRelation = (0, import_drizzle_orm.relations)(wallet, ({ one }) => ({
  user: one(user, {
    fields: [wallet.userId],
    references: [user.id]
  })
}));
var guardRequestRelations = (0, import_drizzle_orm.relations)(guardRequestTable, ({ one }) => ({
  guardian: one(user, {
    fields: [guardRequestTable.guardianId],
    references: [user.id]
  }),
  requestor: one(user, {
    fields: [guardRequestTable.requestorId],
    references: [user.id],
    relationName: "requestor"
  })
}));
var recoveryRequestRelations = (0, import_drizzle_orm.relations)(recoveryRequestTable, ({ one }) => ({
  requestor: one(user, {
    fields: [recoveryRequestTable.requestorId],
    references: [user.id]
  })
}));

// src/db/index.ts
var import_drizzle_orm2 = require("drizzle-orm");
var db = (0, import_node_postgres.drizzle)(process.env.POSTGRES_DB_URL, { schema: schema_exports });
var { user: user2, wallet: wallet2 } = schema_exports;
async function createUserWithWallet({
  userData,
  accountData
}) {
  return await db.transaction(async (tx) => {
    const [insertedUser] = await tx.insert(user2).values({
      email: userData.email,
      emailVerified: userData.emailVerified
    }).returning();
    if (!insertedUser) throw new Error("Could not insert user");
    if (accountData) {
      await tx.insert(wallet2).values({
        userId: insertedUser.id,
        network: accountData.network,
        mnemonic: accountData.mnemonic
      });
    }
    return insertedUser;
  });
}
async function updateUser(userId, updateData) {
  const [updatedUser] = await db.update(user2).set(updateData).where((0, import_drizzle_orm2.eq)(user2.id, userId)).returning();
  return updatedUser;
}
async function updateWallet(accountId, updateData) {
  const [updatedWallet] = await db.update(wallet2).set(updateData).where((0, import_drizzle_orm2.eq)(wallet2.id, accountId)).returning();
  return updatedWallet;
}
async function getUserWithWallets(userId) {
  const result = await db.query.user.findFirst({
    where: (0, import_drizzle_orm2.eq)(user2.id, userId),
    with: {
      wallets: true
      // Populate all wallets
    }
  });
  return result;
}
async function getWalletWithUser(accountId) {
  const result = await db.query.wallet.findFirst({
    where: (0, import_drizzle_orm2.eq)(wallet2.id, accountId),
    with: {
      user: true
      // Populate associated user
    }
  });
  return result;
}
async function deleteUserAndWallets(userId) {
  return await db.transaction(async (tx) => {
    await tx.delete(wallet2).where((0, import_drizzle_orm2.eq)(wallet2.userId, userId));
    const [deletedUser] = await tx.delete(user2).where((0, import_drizzle_orm2.eq)(user2.id, userId)).returning();
    return deletedUser;
  });
}
async function addWalletToUser(walletData) {
  const [newWallet] = await db.insert(wallet2).values({
    userId: walletData.userId,
    mnemonic: walletData.mnemonic,
    network: walletData.network,
    ...walletData
  }).returning({ address: wallet2.address, id: wallet2.id });
  return newWallet;
}

// src/app.ts
var import_adapter = require("hono/adapter");
var app = (0, import_factory3.createFactory)({
  // init app with dbRepo
  // NOTE: update to use user service, cache config
  initApp(app3) {
    app3.use(async (c, next) => {
      const envs = (0, import_adapter.env)(c, "node");
      c.env = {
        ...envs,
        KEY_SHARES: Number(envs.KEY_SHARES),
        KEY_THRESHOLD: Number(envs.KEY_THRESHOLD)
      };
      c.set("dbRepo", {
        createUserWithWallet,
        updateUser,
        updateWallet,
        addWalletToUser,
        deleteUserAndWallets
      });
      await next();
    });
  }
});
var app_default = app;

// src/routes/guardians/create.ts
var import_effect_validator = require("@hono/effect-validator");
var import_schema = require("@effect/schema");
var Body = import_schema.Schema.Struct({
  guardian: import_schema.Schema.String
});
var guardian = app_default.createHandlers((0, import_effect_validator.effectValidator)("json", Body), async (c) => {
  const body = c.req.valid("json");
});

// src/routes/guardians/recover.ts
var import_effect_validator2 = require("@hono/effect-validator");
var import_schema2 = require("@effect/schema");
var Body2 = import_schema2.Schema.Struct({});
var guardianRecovery = app_default.createHandlers((0, import_effect_validator2.effectValidator)("json", Body2), async (c) => {
});

// src/routes/guardians/index.ts
var guardianRoute = app_default.createApp();
guardianRoute.post("/create", ...guardian);
guardianRoute.post("/recover", ...guardianRecovery);

// src/routes/wallet/index.ts
var import_http_exception2 = require("hono/http-exception");

// src/routes/wallet/create.ts
var import_effect_validator3 = require("@hono/effect-validator");
var import_schema3 = require("@effect/schema");

// src/_lib/chains/base.strategy.ts
var BaseChainStrategy = class {
};

// src/_lib/helpers/wallet.ts
var import_accounts = require("viem/accounts");
var import_viem = require("viem");
async function createHDAccounts({
  mnemonic = (0, import_accounts.generateMnemonic)(WORD_LIST),
  // provide wordlist
  numberOfAccounts = 1,
  startIndex = 0,
  basePath = "m/44'/60'/0'/0"
} = {}) {
  try {
    const account2 = (0, import_accounts.mnemonicToAccount)(mnemonic);
    const hdKey = account2.getHdKey();
    const accounts = [];
    for (let i = startIndex; i < startIndex + numberOfAccounts; i++) {
      const path = `${basePath}/${i}`;
      const childKey = hdKey.derive(path);
      if (!childKey.privateKey) {
        throw new Error(`Failed to derive private key for path: ${path}`);
      }
      const privateKey = (0, import_viem.toHex)(childKey.privateKey);
      const address = (0, import_accounts.privateKeyToAddress)(privateKey);
      accounts.push({
        address,
        privateKey,
        publicKey: childKey.publicKey,
        index: i,
        path
      });
    }
    return {
      mnemonic,
      accounts
    };
  } catch (error) {
    throw new Error(`Failed to create HD accounts: ${error.message}`);
  }
}

// src/_lib/chains/evm.strategy.ts
var import_bip39 = __toESM(require("bip39"), 1);

// src/_lib/helpers/hasher.ts
var crypto = __toESM(require("crypto"), 1);
var CryptoUtil = class {
  // Using AES-256-GCM for authenticated encryption
  static ALGORITHM = "aes-256-gcm";
  static SALT_LENGTH = 32;
  static IV_LENGTH = 12;
  // 96 bits for GCM
  static AUTH_TAG_LENGTH = 16;
  static KEY_LENGTH = 32;
  // 256 bits
  static ITERATIONS = 1e5;
  /**
   * Generates a cryptographic key from a password using PBKDF2
   */
  static deriveKey(password, salt) {
    return crypto.scryptSync(password, salt, this.KEY_LENGTH, {
      N: 16384,
      // CPU/memory cost parameter
      r: 8,
      // Block size parameter
      p: 1
      // Parallelization parameter
    });
  }
  static hash(password) {
    const hash = crypto.createHash("sha256");
    hash.update(password);
    return hash.digest("hex");
  }
  static verify(storedHash, inputString) {
    const hash = crypto.createHash("sha256");
    hash.update(inputString);
    const hashString = hash.digest("hex");
    return hashString === storedHash;
  }
  /**
   * Encrypts data using AES-256-GCM with a password
   * @param data - The data to encrypt (string or Buffer)
   * @param password - The password to use for encryption
   * @returns Base64 encoded encrypted data with salt and IV
   */
  static encrypt(data, password) {
    try {
      const salt = new Uint8Array(crypto.randomBytes(this.SALT_LENGTH));
      const iv = new Uint8Array(crypto.randomBytes(this.IV_LENGTH));
      const key = new Uint8Array(this.deriveKey(password, salt));
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
        authTagLength: this.AUTH_TAG_LENGTH
      });
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
      const encryptedData = Buffer.concat([
        cipher.update(dataBuffer),
        cipher.final()
      ]);
      const authTag = cipher.getAuthTag();
      const combined = Buffer.concat([
        salt,
        // 32 bytes
        iv,
        // 12 bytes
        authTag,
        // 16 bytes
        encryptedData
        // Variable length
      ]);
      return combined.toString("base64");
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }
  /**
   * Decrypts data that was encrypted using encrypt()
   * @param encryptedData - Base64 encoded encrypted data
   * @param password - The password used for encryption
   * @returns Decrypted data as a string
   */
  static decrypt(encryptedData, password) {
    try {
      const data = Buffer.from(encryptedData, "base64");
      const salt = data.subarray(0, this.SALT_LENGTH);
      const iv = data.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const authTag = data.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH
      );
      const encryptedContent = data.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH);
      const key = this.deriveKey(password, salt);
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
        authTagLength: this.AUTH_TAG_LENGTH
      });
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(encryptedContent),
        decipher.final()
      ]);
      return decrypted.toString("utf8");
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
  /**
   * Validates if a string is a valid base64 encoded encrypted data
   * @param encryptedData - The data to validate
   * @returns boolean indicating if the data appears to be valid
   */
  static isValidEncryptedData(encryptedData) {
    try {
      const data = Buffer.from(encryptedData, "base64");
      const minimumLength = this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH;
      return data.length >= minimumLength;
    } catch {
      return false;
    }
  }
};

// src/_lib/key-manager/key-manager.service.ts
var import_shamirs_secret_sharing_ts = require("shamirs-secret-sharing-ts");
var import_config = require("dotenv/config");
var KeyManager = class {
  constructor(shares, threshold) {
    this.shares = shares;
    this.threshold = threshold;
    if (!shares) {
      this.shares = Number(process.env.KEY_SHARES);
    }
    if (!threshold) {
      this.threshold = Number(process.env.KEY_THRESHOLD);
    }
  }
  getShares(secret) {
    try {
      const shares = (0, import_shamirs_secret_sharing_ts.split)(
        secret,
        {
          shares: this.shares,
          threshold: this.threshold
        }
      );
      return shares;
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error("Getting shares failed with type error", {
          cause: err
        });
      }
      throw new Error("Failed to split");
    }
  }
  recoverSecret(shares) {
    try {
      const recovered = (0, import_shamirs_secret_sharing_ts.combine)(shares);
      return recovered;
    } catch (err) {
      throw new Error("Failed to combine");
    }
  }
};

// src/_lib/chains/evm.strategy.ts
var import_accounts3 = require("viem/accounts");

// src/_lib/biconomy/client.mts
var import_accounts2 = require("viem/accounts");
var chains = __toESM(require("viem/chains"), 1);
var import_viem2 = require("viem");
var import_abstractjs = require("@biconomy/abstractjs");
var paymasterUrl = (chainId = 84532) => `https://paymaster.biconomy.io/api/v1/${chainId}/0SDld9I3l.a51bbf9c-0700-4385-b434-f4ca64a289fa`;
var bundlerUrl = (chainId = 84532) => `https://bundler.biconomy.io/api/v3/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`;
var getNexusClient = async (privateKey, chainId = 84532, withPM = false) => {
  const account2 = (0, import_accounts2.privateKeyToAccount)(privateKey);
  const nexusClient = (0, import_abstractjs.createSmartAccountClient)({
    account: await (0, import_abstractjs.toNexusAccount)({
      signer: account2,
      chain: (0, import_viem2.extractChain)({ chains: Object.values(chains), id: chainId }),
      transport: (0, import_viem2.http)()
    }),
    transport: (0, import_viem2.http)(bundlerUrl(chainId)),
    paymaster: withPM ? (0, import_abstractjs.createBicoPaymasterClient)({ paymasterUrl: paymasterUrl(chainId) }) : void 0
  });
  const address = nexusClient.account?.address;
  console.log("smart accounts address", address);
  return nexusClient;
};

// src/_lib/chains/evm.strategy.ts
var EVMChainStrategy = class extends BaseChainStrategy {
  PATH = `m/44'/60'/0'/0/0`;
  // use evm path
  networkSlug = "evm";
  // remove parameter requirements if no use
  async createAccount(params) {
    const { mnemonic, accounts } = await createHDAccounts({
      mnemonic: params.mnemonic ?? import_bip39.default.generateMnemonic(),
      numberOfAccounts: 1,
      startIndex: 0,
      basePath: this.PATH
    });
    const walletPK = accounts[0].privateKey;
    const nClient = await getNexusClient(walletPK);
    const smartAddress = nClient.account.address;
    let encryptedPk;
    let hashedPassword;
    if (params.password) {
      const encryptedMnemonic = CryptoUtil.encrypt(mnemonic, params.password);
      hashedPassword = CryptoUtil.hash(params.password);
      const shares2 = new KeyManager().getShares(Buffer.from(walletPK));
      const result2 = await addWalletToUser({
        userId: params.userId,
        mnemonic: encryptedMnemonic,
        // enecrypt with password as well
        network: this.networkSlug,
        address: smartAddress,
        shareA: shares2[0],
        shareB: shares2[1],
        shareC: shares2[2],
        recoveryPassword: hashedPassword
      });
      return {
        accountId: result2.id,
        address: smartAddress
      };
    }
    const shares = new KeyManager().getShares(Buffer.from(accounts[0].privateKey));
    const result = await addWalletToUser({
      userId: params.userId,
      mnemonic,
      // enecrypt with password as well
      network: this.networkSlug,
      address: smartAddress,
      shareA: shares[0],
      shareB: shares[1],
      shareC: shares[2]
    });
    return {
      accountId: result.id,
      address: smartAddress
    };
  }
  async recoverAccount(params) {
    const account2 = await getWalletWithUser(params.walletId);
    if (!account2) throw new Error("Wallet not found");
    if (!account2.recoveryPassword) {
      throw new Error("Password has not been set, wallet has not been created");
    }
    const isValidPassword = CryptoUtil.verify(account2.recoveryPassword, params.password);
    if (isValidPassword) {
      const encryptedPK = new KeyManager().recoverSecret([params.backupShare, account2.shareA]);
      const privateKey = CryptoUtil.decrypt(encryptedPK.toString(), params.password);
      return {
        encryptedPrivateKey: encryptedPK.toString(),
        privateKey,
        address: (0, import_accounts3.privateKeyToAddress)(privateKey)
      };
    }
    throw new Error("Password is not valid");
  }
  // send logic for EVM chains, implement with viem
  async send() {
    throw new Error("Not implemented");
  }
  // get address to receive from db
  async receive() {
    throw new Error("Not implemented");
  }
};

// src/_lib/try-catch.ts
async function tryCatch(promise, action) {
  try {
    const data = await promise;
    return { data };
  } catch (error) {
    logger.error(error, action);
    return { error };
  }
}

// src/_lib/chains/wallet.context.ts
var WalletContext = class {
  constructor(network) {
    this.network = network;
    switch (network) {
      case "evm":
        this.strategy = new EVMChainStrategy();
        break;
      default:
        throw new Error("Network strategy not found");
    }
  }
  // map strategy to network:w
  strategy;
  async createAccount(params) {
    const { data: creationResult, error } = await tryCatch(
      this.strategy.createAccount(params),
      { action: "create-account", network: this.network }
    );
    if (error) throw error;
    return creationResult;
  }
  async recoverAccount(params) {
    const { data: recoveryResult, error } = await tryCatch(
      this.strategy.recoverAccount(params),
      { action: "recover-account", network: this.network }
    );
    if (error) throw error;
    return recoveryResult;
  }
  async useAccount() {
  }
  // TODO: for internal transactions that require the private key without user adding password
};

// src/routes/wallet/create.ts
var import_http_exception = require("hono/http-exception");
var Body3 = import_schema3.Schema.Struct({
  password: import_schema3.Schema.NonEmptyTrimmedString
  // mnemonic: Schema.optional(Schema.NonEmptyTrimmedString),
  // network: Schema.optional(Schema.Union(
  //   Schema.Literal('evm'),
  //   Schema.Literal('btc'),
  //   Schema.Literal('solana')
  // ))
});
var createWalletHandler = app_default.createHandlers(
  (0, import_effect_validator3.effectValidator)("json", Body3),
  async (c) => {
    const user3 = c.get("user");
    if (!user3) throw new import_http_exception.HTTPException(404, { message: "User not found" });
    const body = c.req.valid("json");
    const walletContext = new WalletContext("evm");
    const createResult = await walletContext.createAccount({
      password: body.password,
      userId: user3?.id
      // mnemonic: body.mnemonic
    });
    return c.json({
      status: "success",
      message: "Wallet created successfuly",
      data: {
        accountId: createResult.accountId,
        address: createResult.address
      }
    }, 201);
  }
);

// src/routes/wallet/recover.ts
var import_effect_validator4 = require("@hono/effect-validator");
var import_schema4 = require("@effect/schema");
var import_validator = require("hono/validator");
var Body4 = import_schema4.Schema.Struct({
  password: import_schema4.Schema.NonEmptyTrimmedString,
  qrCodeBase64Url: import_schema4.Schema.NonEmptyTrimmedString,
  walletId: import_schema4.Schema.NonEmptyTrimmedString
});
var recoverWalletHandler = app_default.createHandlers(
  (0, import_effect_validator4.effectValidator)("json", Body4),
  (0, import_validator.validator)("header", (value, c) => {
    const userId = value["x-user-id"];
    return {
      userId
    };
  }),
  async (c) => {
    const body = c.req.valid("json");
    const header = c.req.valid("header");
    const walletContext = new WalletContext("evm");
    const accounts = await walletContext.recoverAccount({
      password: body.password,
      backupShare: Buffer.from(body.qnum, "base64"),
      walletId: body.walletId
    });
    return c.json({
      status: "success",
      message: "Recovered wallet",
      data: {
        // ...accounts
      }
    });
  }
);

// src/_lib/utils.ts
var import_qrcode = __toESM(require("qrcode"), 1);
var generateQR = async (value) => {
  const { data: dataUrl, error } = await tryCatch(
    import_qrcode.default.toDataURL(value),
    { action: "generate-qrcode" }
  );
  if (error) throw new Error("Failed to generate QR Code");
  return dataUrl;
};

// src/routes/wallet/index.ts
var walletRoute = app_default.createApp();
walletRoute.use(async (c, next) => {
  const session2 = c.get("session");
  if (!session2) throw new import_http_exception2.HTTPException(401, { message: "Unauthorized access" });
  await next();
});
var getWallet = app_default.createHandlers(async (c) => {
  const userId = c.get("user")?.id;
  if (!userId) throw new import_http_exception2.HTTPException(404, { message: "User not found" });
  const { data: user3, error } = await tryCatch(getUserWithWallets(userId));
  if (error) throw new import_http_exception2.HTTPException(500, { message: "Something went wrong getting user data" });
  if (!user3) throw new import_http_exception2.HTTPException(404, { message: "User not found" });
  const wallets = await Promise.all(
    user3.wallets.map(async (w) => {
      if (w.isBackedUp) {
        return {
          address: w.address,
          network: w.network
        };
      }
      const { data: qrCode, error: error2 } = await tryCatch(generateQR(w.shareC.toString("base64")));
      if (error2) throw new import_http_exception2.HTTPException(500, { message: error2.message });
      return {
        qrCode,
        localKey: w.shareB && w.shareB.toString("base64"),
        address: w.address,
        network: w.network
      };
    })
  );
  return c.json(wallets);
});
var backupWallet = app_default.createHandlers(async (c) => {
  const userId = c.get("user")?.id;
  if (!userId) throw new import_http_exception2.HTTPException(404, { message: "User not found" });
  const { error } = await tryCatch(db.update(wallet).set({
    isBackedUp: true,
    shareC: void 0,
    shareB: void 0
  }));
  if (error) throw new import_http_exception2.HTTPException(500, { message: "Something went wrong backing up wallet" });
  return c.json({
    success: true,
    message: "Wallet backed up"
  });
});
walletRoute.get("/", ...getWallet);
walletRoute.post("/create", ...createWalletHandler);
walletRoute.put("/backup", ...backupWallet);
walletRoute.post("/recover", ...recoverWalletHandler);

// src/routes/user/index.ts
var import_http_exception4 = require("hono/http-exception");

// src/routes/user/update.ts
var import_effect_validator5 = require("@hono/effect-validator");
var import_schema6 = require("@effect/schema");
var import_http_exception3 = require("hono/http-exception");
var Body5 = import_schema6.Schema.Record({
  key: import_schema6.Schema.String,
  value: import_schema6.Schema.Any
});
var updateUserHandlers = app_default.createHandlers(
  (0, import_effect_validator5.effectValidator)("json", Body5),
  async (c) => {
    const body = c.req.valid("json");
    const user3 = c.get("user");
    console.log(user3, ":::user in current session");
    console.log(body, ":::body");
    if (!user3) throw new import_http_exception3.HTTPException(
      404,
      {
        message: "User not found",
        res: c.res,
        cause: { action: "update-user" }
      }
    );
    const { error } = await tryCatch(updateUser(user3.id, {
      ...body
    }));
    if (error) throw new import_http_exception3.HTTPException(500, { message: "Failed to update user" });
    return c.json({
      "success": true,
      "message": "User update successfully"
    }, 200);
  }
);

// src/routes/user/index.ts
var userRoute = app_default.createApp();
userRoute.use(async (c, next) => {
  const session2 = c.get("session");
  if (!session2) {
    throw new import_http_exception4.HTTPException(401, { message: "Unauthorized to access this route" });
  }
  await next();
});
var getUserHandlers = app_default.createHandlers(async (c) => {
  const session2 = c.get("session");
  if (!session2) {
    throw new import_http_exception4.HTTPException(404, { message: "User session not found" });
  }
  const user3 = await getUserWithWallets(session2.userId);
  if (!user3) throw new import_http_exception4.HTTPException(404, { message: "User was not found in db" });
  return c.json(user3, 200);
});
userRoute.post("/update", ...updateUserHandlers);
userRoute.get("/me", ...getUserHandlers);

// src/_lib/shared/auth.ts
var import_better_auth = require("better-auth");
var import_expo = require("@better-auth/expo");
var import_drizzle = require("better-auth/adapters/drizzle");
var baseURL = `https://cca3-2c0f-2a80-a85-fc10-812f-b490-2dc9-c4c4.ngrok-free.app`;
var auth = (0, import_better_auth.betterAuth)({
  database: (0, import_drizzle.drizzleAdapter)(db, { provider: "pg" }),
  plugins: [
    (0, import_expo.expo)()
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true
  },
  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectURI: `${baseURL}/api/auth/callback/google`
    },
    apple: {
      enabled: false,
      clientId: ``,
      clientSecret: ``,
      clientKey: ``
    }
  },
  advanced: {
    cookiePrefix: "ewallet"
  },
  trustedOrigins: ["ewallet://", "exp://192.168.1.38:8081/--/home", "exp://192.168.1.38:8081/--"]
});

// src/router.ts
function setupRouter(app3) {
  app3.use("*", honoLogger);
  ;
  app3.use("*", panicLogger);
  app3.use("*", (0, import_pretty_json.prettyJSON)());
  app3.use("*", (0, import_cors.cors)({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["*"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
    credentials: true
  }));
  app3.use("*", async (c, next) => {
    const session2 = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session2) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }
    c.set("user", session2.user);
    c.set("session", session2.session);
    return next();
  });
  const v1App = app3.basePath("/api/v1");
  v1App.route("/guardian", guardianRoute);
  v1App.route("/wallet", walletRoute);
  v1App.route("/user", userRoute);
  app3.on(["POST", "GET"], "/api/*", (c) => {
    return auth.handler(c.req.raw);
  });
  v1App.get("/health", healthCheck);
  v1App.notFound((c) => {
    return c.text(`Could not find the route, ${c.req.url}`);
  });
  v1App.onError((err, c) => {
    console.error(err);
    return c.json(
      {
        status: "failed",
        message: "Internal server error",
        error: JSON.stringify(err, null, 4)
      },
      500
    );
  });
  (0, import_dev.showRoutes)(v1App, {
    verbose: true,
    colorize: true
  });
}

// src/index.ts
var app2 = app_default.createApp();
setupRouter(app2);
var port = 9001;
var server = (0, import_node_server.serve)(
  {
    fetch: app2.fetch,
    port
  },
  (info) => {
    logger.info(`Server is ready on port [${info.port}], with address [${info.address}]`);
  }
);
process.on("SIGINT", () => {
  server.close((err) => {
    if (err) {
      logger.error(`\u274C Error trying to close connection ${err}`);
    } else {
      logger.info(`\u2705 Server closed successfully`);
    }
  });
});
process.on("uncaughtException", (err) => {
  logger.fatal(err, "uncaught exception detected");
  server.close((err2) => {
    logger.error(err2, "Error closing server");
    process.exit(1);
  });
  setTimeout(() => {
    process.abort();
  }, 1e3).unref();
  process.exit(1);
});

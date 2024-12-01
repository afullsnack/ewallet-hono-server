import { drizzle } from "drizzle-orm/libsql";
import * as schema from './schema';
import { eq } from "drizzle-orm";

// NOTE: Add schema to drizzle initialization so table types are available for repo functions
const db = drizzle(process.env.DB_FILE_NAME!, { schema });
export { db };

// -----------  db repo functions  -------- 
const { usersTable, accountTable } = schema;
type UserInsert = typeof usersTable.$inferInsert;
type AccountInsert = typeof accountTable.$inferInsert;
// Create User with Optional Wallet
interface ICreateUserWithWallet {
  userData: UserInsert;
  accountData?: AccountInsert;
}
export async function createUserWithWallet(
  {
    userData,
    accountData,
  }: ICreateUserWithWallet
) {
  return await db.transaction(async (tx) => {
    // Insert User
    const [insertedUser] = await tx.insert(usersTable).values({
      username: userData.username,
      email: userData.email,
    }).returning();

    // Optionally Insert Wallet if provided
    if (accountData) {
      await tx.insert(accountTable).values({
        userId: insertedUser.id,
        networkType: accountData.networkType,
        shareA: accountData.shareA,
        shareB: accountData.shareB,
        shareC: accountData.shareC,
      });
    }

    return insertedUser;
  });
}

// Update User
export async function updateUser(
  userId: string,
  updateData: Partial<UserInsert>
) {
  const [updatedUser] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, userId))
    .returning();

  return updatedUser;
}

// Update Wallet
export async function updateWallet(
  accountId: string,
  updateData: Partial<AccountInsert>
) {
  const [updatedWallet] = await db
    .update(accountTable)
    .set(updateData)
    .where(eq(accountTable.id, accountId))
    .returning();

  return updatedWallet;
}

// Get User with All Wallets
export async function getUserWithWallets(userId: string) {
  const result = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
    with: {
      accounts: true, // Populate all wallets
    },
  });

  return result;
}

// Get Wallet with Associated User
export async function getWalletWithUser(accountId: string) {
  const result = await db.query.accountTable.findFirst({
    where: eq(accountTable.id, accountId),
    with: {
      user: true, // Populate associated user
    },
  });

  return result;
}

// List All Users with Their Wallets
export async function listUsersWithWallets() {
  const results = await db.query.usersTable.findMany({
    with: {
      accounts: true,
    },
  });

  return results;
}

// Delete User and Associated Wallets
export async function deleteUserAndWallets(userId: string) {
  return await db.transaction(async (tx) => {
    // Delete associated wallets first
    await tx.delete(accountTable).where(eq(accountTable.userId, userId));

    // Then delete the user
    const [deletedUser] = await tx.delete(usersTable)
      .where(eq(usersTable.id, userId))
      .returning();

    return deletedUser;
  });
}

// Add Wallet to Existing User
export async function addWalletToUser(
  userId: string,
  walletData: Partial<{
    networkType: any,
    shareA: Buffer,
    shareB: Buffer,
    shareC: Buffer,
  }>
) {
  const [newWallet] = await db.insert(accountTable).values({
    userId,
    networkType: walletData.networkType,
    shareA: walletData.shareA,
    shareB: walletData.shareB,
    shareC: walletData.shareC,
  }).returning();

  return newWallet;
}

import { drizzle } from "drizzle-orm/libsql";
import * as schema from './schema';
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DB_FILE_NAME!, {schema});
export { db };

// -----------  db repo functions  -------- 
const {usersTable, accountTable} = schema;
// Create User with Optional Wallet
export async function createUserWithWallet(userData: typeof usersTable.$inferInsert
// {
//   username: string;
//   email: string;
  // wallet?: {
  //   address: string;
  //   balance?: string;
  //   type: 'eoa' | 'contract';
  //   shareA?: Buffer;
  // };
// }
) {
  return await db.transaction(async (tx) => {
    // Insert User
    const [insertedUser] = await tx.insert(usersTable).values({
      username: userData.username,
      email: userData.email,
    }).returning();

    // Optionally Insert Wallet if provided
    // if (userData.wallet) {
    //   await tx.insert(wallets).values({
    //     userId: insertedUser.id,
    //     address: userData.wallet.address,
    //     balance: userData.wallet.balance ?? '0',
    //     type: userData.wallet.type,
    //     shareA: userData.wallet.shareA,
    //   });
    // }

    return insertedUser;
  });
}

// Update User
export async function updateUser(
  userId: string, 
  updateData: Partial<{
    username: string;
    email: string;
  }>
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
  walletId: string, 
  updateData: Partial<typeof accountTable.$inferInsert>
) {
  const [updatedWallet] = await db
    .update(accountTable)
    .set(updateData)
    .where(eq(accountTable.id, walletId))
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
export async function getWalletWithUser(walletId: string) {
  const result = await db.query.accountTable.findFirst({
    where: eq(accountTable.id, walletId),
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

import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from './schema';
import { eq } from "drizzle-orm";

// NOTE: Add schema to drizzle initialization so table types are available for repo functions
const db = drizzle(process.env.POSTGRES_DB_URL!, { schema });
export { db };

// -----------  db repo functions  -------- 
const { user, wallet, recoveryRequestTable } = schema;
type UserInsert = typeof user.$inferInsert;
type UserUpdate = typeof user.$inferSelect;
type AccountInsert = typeof wallet.$inferInsert;
type AccountUpdate = typeof wallet.$inferSelect;
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
    const [insertedUser] = await tx.insert(user).values({
      email: userData.email,
      emailVerified: userData.emailVerified
    }).returning();

    if(!insertedUser) throw new Error('Could not insert user');

    // Optionally Insert Wallet if provided
    if (accountData) {
      await tx.insert(wallet).values({
        userId: insertedUser.id,
        network: accountData.network,
        mnemonic: accountData.mnemonic
      });
    }

    return insertedUser;
  });
}

// Update User
export async function updateUser(
  userId: string,
  updateData: Partial<UserUpdate>
) {
  const [updatedUser] = await db
    .update(user)
    .set(updateData)
    .where(eq(user.id, userId))
    .returning();

  return updatedUser;
}

// Update Wallet
export async function updateWallet(
  accountId: string,
  updateData: Partial<AccountUpdate>
) {
  const [updatedWallet] = await db
    .update(wallet)
    .set(updateData)
    .where(eq(wallet.id, accountId))
    .returning();

  return updatedWallet;
}

// Get User with All Wallets
export async function getUserWithWallets(userId: string) {
  const result = await db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      wallets: true, // Populate all wallets
    },
  });

  return result;
}

export async function getUserWithEmailOrUsername(emailOrUsername: string) {
  const result = await db.query.user.findFirst({
    where: ((user, {eq, or}) =>  or(eq(user.email, emailOrUsername), eq(user.username, emailOrUsername))),
  })
  return result;
}

// Get Wallet with Associated User
export async function getWalletWithUser(accountId: string) {
  const result = await db.query.wallet.findFirst({
    where: eq(wallet.id, accountId),
    with: {
      user: true, // Populate associated user
    },
  });

  return result;
}

export async function getWallet(accountId: string) {
  try {
  const result = await db.query.wallet.findFirst({
    where: eq(wallet.id, accountId),
  });
  return result;
  }
  catch(error: any) {
    console.log(error, {action: 'get-wallet'});
    throw new Error('Failed to get wallet', {cause: error});
  }
}

// List All Users with Their Wallets
export async function listUsersWithWallets() {
  const results = await db.query.user.findMany({
    with: {
      wallets: true,
    },
  });

  return results;
}

// Delete User and Associated Wallets
export async function deleteUserAndWallets(userId: string) {
  return await db.transaction(async (tx) => {
    // Delete associated wallets first
    await tx.delete(wallet).where(eq(wallet.userId, userId));

    // Then delete the user
    const [deletedUser] = await tx.delete(user)
      .where(eq(user.id, userId))
      .returning();

    return deletedUser;
  });
}

// Add Wallet to Existing User
export async function addWalletToUser(
  walletData: Partial<AccountUpdate>
) {
  const [newWallet] = await db.insert(wallet).values({
    userId: walletData.userId!,
    mnemonic: walletData.mnemonic!,
    network: walletData.network!,
    ...walletData
  }).returning({address: wallet.address, id: wallet.id});

  return newWallet;
}

// create recovery request
export async function createRecoveryRequest(requestorId: string) {
  const [newRequest] = await db.insert(recoveryRequestTable)
    .values({
      requestorId,
      expiresIn: new Date(Date.now()+3600000)
    })
    .returning({
      requestorId: recoveryRequestTable.requestorId,
      id: recoveryRequestTable.id,
      expiresIn: recoveryRequestTable.expiresIn
    })
    return newRequest;
}

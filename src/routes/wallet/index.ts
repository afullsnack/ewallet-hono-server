import { HTTPException } from "hono/http-exception";
import appFactory from "../../app";
import { createWalletHandler } from "./create";
import { recoveryRoute } from "./recover";
import { db, getUserWithWallets } from "../../db";
import { generateQR } from "../../_lib/utils";
import { wallet } from "../../db/schema";
import { tryCatch } from "../../_lib/try-catch";
import { transactionRoute } from "./transaction";
import { networkRoute } from "./network"

const walletRoute = appFactory.createApp();
walletRoute.route('/recover', recoveryRoute);

walletRoute.use(async (c, next) => {
  const session = c.get('session');
  if (!session) throw new HTTPException(401, { message: 'Unauthorized access' });
  await next();
})

const getWallet = appFactory.createHandlers(async (c) => {
  const userId = c.get('user')?.id;
  if (!userId) throw new HTTPException(404, { message: 'User not found' });

  const { data: user, error } = await tryCatch(getUserWithWallets(userId));
  if (error) throw new HTTPException(500, { message: 'Something went wrong getting user data' })
  if (!user) throw new HTTPException(404, { message: 'User not found' });

  const wallets = await Promise.all(
    user.wallets.map(async (w) => {
      // if its already backedup means shares B and C have been removed
      if (w.isBackedUp) {
        return {
          address: w.address,
          network: w.network,
        }
      }

      const qrBase64 = w.shareC!;
      const localKey = w.shareB!;
      console.log(qrBase64, ":::utf16le qr")
      console.log(localKey, ":::localkey utf16le")
      const { data: qrCode, error } = await tryCatch(generateQR(qrBase64));
      if (error) throw new HTTPException(500, { message: error.message });

      return {
        qrCode,
        localKey,
        address: w.address,
        network: w.network
      }
    })
  );
  return c.json(wallets);
})

const backupWallet = appFactory.createHandlers(async (c) => {
  const userId = c.get('user')?.id;
  if (!userId) throw new HTTPException(404, { message: 'User not found' });

  const { error, data } = await tryCatch(db.update(wallet).set({
    isBackedUp: true,
    // shareC: null,
    // shareB: null
  }));
  if (error) throw new HTTPException(500, { message: 'Something went wrong backing up wallet' });

  return c.json({
    success: true,
    message: 'Wallet backed up'
  })
})

walletRoute.get('/', ...getWallet);
walletRoute.post('/create', ...createWalletHandler);
walletRoute.put('/backup', ...backupWallet);
walletRoute.route('/transaction', transactionRoute);
walletRoute.route('/network', networkRoute);

export { walletRoute };

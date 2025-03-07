import { HTTPException } from "hono/http-exception";
import appFactory from "../../app";
import { createWalletHandler } from "./create";
import { recoverWalletHandler } from "./recover";
import { db, getUserWithWallets } from "../../db";
import { generateQR } from "../../_lib/utils";
import { wallet } from "../../db/schema";
import { tryCatch } from "src/_lib/try-catch";

const walletRoute = appFactory.createApp();

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
      if(w.isBackedUp) {
        return {
          address: w.address,
          network: w.network,
        }
      }

      const {data: qrCode, error} = await tryCatch(generateQR(w.shareC!.toString('base64')));
      if(error) throw new HTTPException(500, {message: error.message});
      
      return {
        qrCode,
        localKey: w.shareB && w.shareB.toString('base64'),
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

  const { error } = await tryCatch(db.update(wallet).set({
    isBackedUp: true,
    shareC: undefined,
    shareB: undefined
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
walletRoute.post('/recover', ...recoverWalletHandler);

export { walletRoute };

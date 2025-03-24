import { HTTPException } from "hono/http-exception";
import appFactory from "../../app";
import { createWalletHandler } from "./create";
import { recoveryRoute } from "./recover";
import { db, getUserWithWallets } from "../../db";
import { generateQR, WalletToken } from "../../_lib/utils";
import { wallet } from "../../db/schema";
import { tryCatch } from "../../_lib/try-catch";
import { transactionRoute } from "./transaction";
import { networkRoute } from "./network"
import { getBalance } from "../../_lib/biconomy/client.mts";
import { logger } from "../../middlewares/logger";
import { Address } from "viem";
import { zValidator } from "@hono/zod-validator";
import { z } from 'zod'

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

  const { error } = await tryCatch(db.update(wallet).set({
    isBackedUp: true,
  }));
  if (error) throw new HTTPException(500, { message: 'Something went wrong backing up wallet' });

  return c.json({
    success: true,
    message: 'Wallet backed up'
  })
})

const getUserAssets = appFactory.createHandlers(async (c) => {
  const session = c.get('session');
  const params = c.req.param();
  console.log("Params:::", params);

  if (!session) {
    throw new HTTPException(404, { message: 'User session not found' });
  }
  const user = await getUserWithWallets(session.userId)
  if (!user) throw new HTTPException(404, { message: 'User was not found in db' });

  const assets: (WalletToken & {balance: number, usdBalance: number})[] = [];
  if (user?.wallets.length) {
    for (const wallet of user.wallets) {
      if (wallet.tokens) {
        const tokens = wallet.tokens as WalletToken[]
        let balance: number = 0;
        for(const token of tokens) {
          if (token.isNative) {
            const { data, error } = await tryCatch(getBalance(Number(wallet.chainId!), wallet?.address! as Address))
            // TODO: get price as well
            logger.error(error)
            logger.info("balance:::", balance)
            if (data) balance += data;
          }else {
            // TODO: get non-native currency balance
            // and price
          }

          
        }
        
      }
    }
  }

  const usdBalance = balance * 1963;
  // const assets = [
  //   {
  //     title: 'Base',
  //     exchange: 0.08,
  //     asset: balance,
  //     slug: 'ETH',
  //     pip: usdBalance,
  //     signal: 0.31
  //   }
  // ]

  return c.json({ balance: usdBalance, assets, network: 'USD' }, 200)
})


const getAssetsInfo = appFactory.createHandlers(
  zValidator('param', z.object({
    chainId: z.string().default('all'),
    address: z.string().default('all')
  })),
  async (c) => {
    const params = c.req.valid('param');
    logger.info('Params:::', params)
    if (params.chainId === 'all' && params.address === 'all') {
      // return all tokens in wallet table for users
    }
  })

walletRoute.get('/', ...getWallet);
walletRoute.get('/:chainId/:address/info', ...getAssetsInfo)
walletRoute.get('/assets', ...getUserAssets);
walletRoute.post('/create', ...createWalletHandler);
walletRoute.put('/backup', ...backupWallet);
walletRoute.route('/transaction', transactionRoute);
walletRoute.route('/network', networkRoute);

export { walletRoute };

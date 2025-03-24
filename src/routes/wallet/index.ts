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
import { getBalance, getNonNativeBalance } from "../../_lib/biconomy/client.mts";
import { logger } from "../../middlewares/logger";
import { Address, extractChain, isAddress } from "viem";
import { zValidator } from "@hono/zod-validator";
import { z } from 'zod';
import * as chains from "viem/chains";
import * as logoAssets from "../../coin_map.json";

const walletRoute = appFactory.createApp();
walletRoute.route('/recover', recoveryRoute);

// walletRoute.use(async (c, next) => {
//   const session = c.get('session');
//   if (!session) throw new HTTPException(401, { message: 'Unauthorized access' });
//   await next();
// })

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

  const assets: (WalletToken & { balance: number, usdBalance: number })[] = [];
  if (user?.wallets.length) {
    for (const wallet of user.wallets) {
      if (wallet.tokens) {
        const tokens = wallet.tokens as WalletToken[]
        let balance: number = 0;
        for (const token of tokens) {
          if (token.isNative) {
            const { data, error } = await tryCatch(getBalance(Number(wallet.chainId!), wallet?.address! as Address))
            // TODO: get price as well
            if (error) {
              logger.error(error)
              throw new Error('Failed to get balances')
            }
            logger.info("balance:::", balance)
            if (data) balance += data;
            const existingAsset = assets.find((a) => a.symbol === token.symbol)
            if (existingAsset) {
              assets.filter((a) => a.symbol !== token.symbol).push({
                ...token,
                balance: data + existingAsset.balance,
                usdBalance: (data * 1920) + existingAsset.usdBalance
              })
            }
            assets.push({
              ...token,
              balance: data,
              usdBalance: data * 1920
            })
          } else {
            // and price
            if (token.address && !isAddress(token.address)) {
              throw new Error('Token address is invalid')
            }
            const { data, error } = await tryCatch(getNonNativeBalance(Number(wallet.chainId), token.address as Address, wallet.address as Address))
            if (error) {
              logger.error('Error:::', error)
              throw new Error('Failed to get non-native balances')
            }
            logger.info('Balance:::', data)
            if (data) balance += data
            const existingAsset = assets.find((a) => a.symbol === token.symbol)
            if (existingAsset) {
              assets.filter((a) => a.symbol !== token.symbol).push({
                ...token,
                balance: data + existingAsset.balance,
                usdBalance: (data * 1920) + existingAsset.usdBalance
              })
            }
            assets.push({
              ...token,
              balance: data,
              usdBalance: data * 1920
            })
          }
        }
        logger.info('Assets:::', assets)
      }
    }
  }

  const totalUsdBalance = assets.reduce((pre, cur) => pre + cur.usdBalance, 0)
  return c.json({
    balance: totalUsdBalance,
    assets,
    network: 'USD'
  }, 200)
})


const getAssetsInfo = appFactory.createHandlers(
  zValidator('param', z.object({
    chainId: z.string().default('all'),
    address: z.string().default('all')
  })),
  async (c) => {
    const params = c.req.valid('param');
    const user = c.get('user');
    logger.info('Params:::', params);
    if (params.chainId === 'all' && params.address === 'all') {
      // return all tokens in wallet table for users
      const userWallets = await db.query.wallet.findMany({
        where: ((wa, { eq }) => eq(wa.userId, user?.id!))
      })

      const assets = userWallets.map((wallet) => {
        const tokens = wallet.tokens as WalletToken[]
        const chain = extractChain({chains: Object.values(chains), id: Number(wallet.chainId) as any})
        return {
          tokens,
          chain: {
            name: chain.name,
            imgUrl: logoAssets.find((l) => l.name === chain.name)
          }
        }
      })
      return c.json(assets);
    }
  })


const addTokenHandler = appFactory.createHandlers(
  zValidator('param', z.object({
    chainId: z.string().min(3),
    symbol: z.string().min(3)
  })),
  (c) => {
    const params = c.req.valid('param')
    console.log('Params:::', params)

    return c.json({})
  }
)

walletRoute.get('/', ...getWallet);

walletRoute.get('/:chainId/:symbol/info', ...getAssetsInfo)
walletRoute.post('/:chainId/:symbol/add', ...addTokenHandler)
walletRoute.get('/assets', ...getUserAssets);

walletRoute.post('/create', ...createWalletHandler);
walletRoute.put('/backup', ...backupWallet);
walletRoute.route('/transaction', transactionRoute);

walletRoute.route('/network', networkRoute);

export { walletRoute };

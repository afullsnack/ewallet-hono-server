import { HTTPException } from "hono/http-exception";
import appFactory from "../../app";
import { createWalletHandler } from "./create";
import { recoveryRoute } from "./recover";
import { db, getUserWithWallets, getWalletWithUser } from "../../db";
import { generateQR, getCoingeckoMarketData, getCoingeckoTokenIdList, getCoingeckoTokenInfo, getCoingeckoTokenPrice, WalletToken } from "../../_lib/utils";
import { wallet } from "../../db/schema";
import { tryCatch } from "../../_lib/try-catch";
import { transactionRoute } from "./transaction";
import { networkRoute } from "./network"
import { getBalance, getNexusClient, getNonNativeBalance, getTokenData } from "../../_lib/biconomy/client.mts";
import { logger } from "../../middlewares/logger";
import { AbiErrorInputsNotFoundError, Address, extractChain, Hex, isAddress } from "viem";
import { zValidator } from "@hono/zod-validator";
import { z } from 'zod';
import * as chains from "viem/chains";
import { default as coinMap } from "../../coin_map.json";
import { eq } from "drizzle-orm";

const logoAssets = coinMap as { img_url: string; name: string; slug: string; symbol: string; }[];
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

const getUserAssets = appFactory.createHandlers(
  async (c) => {
  try {
    const session = c.get('session');

    if (!session) {
      throw new HTTPException(404, { message: 'User session not found' });
    }
    const user = await getUserWithWallets(session.userId)
    if (!user) throw new HTTPException(404, { message: 'User was not found in db' });

    const assets: (WalletToken & {
      price: number,
      balance: number,
      pnl24H: number;
      percentPnL24H: number;
      usdBalance: number;
      chainName: string;
      chainUrl: string;
      tokenUrl: string;
    })[] = [];
    if (user?.wallets.length) {
      for (const wallet of user.wallets) {
        const nexusClient = await getNexusClient(wallet.privateKey! as Hex, Number(wallet.chainId), false)
        if (wallet.tokens) {
          const tokens = wallet.tokens as WalletToken[]
          let balance: number = 0;
          for (const token of tokens) {
            // const { data: price, error: priceError } = await tryCatch(getCoingeckoTokenPrice(token.cgId))
            // if (priceError) {
            //   console.log('Price error', priceError)
            // }
            const {data: infoData, error: infoError} = await tryCatch(getCoingeckoTokenInfo(token.cgId))
            if (infoError) {
              console.log('Price error', infoError)
              throw new HTTPException(500, {message: infoError.message ?? 'Error getting token info'})
            }
            const tokenPrice24hAgo = infoData?.market_data?.current_price?.usd - infoData?.market_data?.price_change_24h;
            if (token.isNative) {
              const { data, error } = await tryCatch(getBalance(nexusClient, wallet?.address! as Address))
              // TODO: get price as well
              if (error) {
                logger.error(error)
                throw new Error('Failed to get balances')
              }
              logger.info(`Balance on ${wallet.chainId}:::${data}`)
              if (data) balance += data;
              const currentAssetBalance = data * Number(infoData?.market_data?.current_price?.usd);
              const assetUSDBalance24hAgo = data * tokenPrice24hAgo
              const pnl = currentAssetBalance-assetUSDBalance24hAgo
              const pnlPercent = (pnl/currentAssetBalance)*100
              console.log('Percent PnL', (pnl/currentAssetBalance)*100, pnl, currentAssetBalance)
              assets.push({
                ...token,
                price: infoData.market_data?.current_price.usd,
                balance: data,
                pnl24H: pnl,
                percentPnL24H: Number.isNaN(pnlPercent)? 0 : pnlPercent,
                usdBalance: currentAssetBalance,
                chainName: nexusClient.account.chain?.name,
                chainUrl: wallet.chainLogo ?? '',
                tokenUrl: infoData.image['small'] ?? logoAssets.find((logo) => logo.symbol === `${token.symbol === 'USDC' ? '$USDC' : token.symbol}`)?.img_url ?? '',
              })
            } else {
              // and price
              if (token.address && !isAddress(token.address)) {
                throw new Error('Token address is invalid')
              }
              const { data, error } = await tryCatch(getNonNativeBalance(nexusClient, token.address as Address, wallet.address as Address, token.decimals))
              if (error) {
                logger.error('Error:::', error)
                throw new Error('Failed to get non-native balances')
              }
              logger.info(`Balance on ${wallet.chainId}:::${data}`)
              if (data) balance += data
              const currentAssetBalance = data * Number(infoData?.market_data?.current_price?.usd);
              const assetUSDBalance24hAgo = data * tokenPrice24hAgo
              const pnl = currentAssetBalance-assetUSDBalance24hAgo
              const pnlPercent = (pnl/currentAssetBalance)*100
              console.log('Percent PnL', (pnl/currentAssetBalance)*100, pnl, currentAssetBalance)
              assets.push({
                ...token,
                price: infoData.market_data?.current_price.usd,
                balance: data,
                pnl24H: pnl,
                percentPnL24H: Number.isNaN(pnlPercent)? 0 : pnlPercent,
                usdBalance: currentAssetBalance,
                chainName: nexusClient.account.chain?.name,
                chainUrl: wallet.chainLogo ?? '',
                tokenUrl: infoData.image['small'] ?? logoAssets.find((logo) => logo.symbol === `${token.symbol === 'USDC' ? '$USDC' : token.symbol}`)?.img_url ?? '',
              })
            }
          }
          // logger.info(assets, 'Assets:::',)
        }
      }
    }

    const totalUsdBalance = assets.reduce((pre, cur) => pre + cur.usdBalance, 0)
    const totalPnL24h = assets.reduce((pre, curr) => pre+curr.pnl24H, 0)
    const totalPercentagePnL24h = (totalPnL24h/totalUsdBalance)*100
    return c.json({
      balance: totalUsdBalance,
      totalPnL24h,
      totalPercentagePnL24h,
      assets,
      network: 'USD'
    }, 200)
  }
  catch (error: any) {
    console.log('Get Assets:::', error)
  }
})


const getAssetsInfo = appFactory.createHandlers(
  zValidator('param', z.object({
    chainId: z.string().default('all'),
    symbol: z.string().default('all')
  })),
  async (c) => {
    const params = c.req.valid('param');
    const user = c.get('user');
    if (!user) throw new HTTPException(404, { message: 'User not found' })
    console.log('Params:::', params);
    // return all tokens in wallet table for users
    const userWallets = await getUserWithWallets(user?.id!)
    if (!userWallets) throw new HTTPException(404, { message: 'Wallet not found' })

    const chainWallet = userWallets?.wallets.find((w) => w.chainId === params.chainId)
    const token = (chainWallet?.tokens as WalletToken[]).find((t) => t.symbol === params.symbol)
    if (!token) throw new HTTPException(404, { message: 'Token not found in asset list' })

    const { data, error } = await tryCatch(getCoingeckoTokenInfo(token.cgId))
    if (error) throw new HTTPException(400, { message: 'Could not get token info' })

    const { data: price, error: priceError } = await tryCatch(getCoingeckoTokenPrice(token.cgId))
    if (priceError) {
      console.log('Price error', priceError)
    }
    const activities = await db.query.transaction.findMany({
      orderBy: (trans, { desc }) => [desc(trans.createdAt)],
      where: ((trans, { eq, and, or }) => and(
        eq(trans.status, 'complete'),
        eq(trans.token, token.symbol),
        eq(trans.chainId, token.chain.toString()),
        or(eq(trans.sender, user.id), eq(trans.userId, user.id))))
    })

    return c.json({
      success: true,
      message: 'Token info',
      data: {
        price: (price as Record<string, any>)[token.cgId]?.usd,
        activities,
        info: data
      }
    })
  })


const addTokenHandler = appFactory.createHandlers(
  zValidator('param', z.object({
    chainId: z.string().min(3),
  })),
  zValidator('json', z.object({
    address: z.string(),
    name: z.string().min(3),
    decimals: z.number({ coerce: true }),
    symbol: z.string()
  })),
  async (c) => {
    const params = c.req.valid('param')
    const body = c.req.valid('json')
    console.log('Params:::', params)
    console.log('Body:::', body)
    const user = c.get('user')
    if (!user) throw new HTTPException(404, { message: 'User not found' })

    const userWallets = await getUserWithWallets(user.id)
    if (!userWallets) throw new HTTPException(404, { message: 'User wallets not found' })
    const chainWallet = userWallets.wallets.find((w) => w.chainId === params.chainId)
    const tokens = chainWallet?.tokens as WalletToken[]
    console.log('Tokens:::', tokens)
    if (tokens.some((t: any) => t.symbol === body.symbol && t.address === body.address)) {
      console.log('Token exists:::',)
      return c.json({
        success: true,
        message: 'Token already in wallet'
      })
    }
    // query api for token info
    const { data, error } = await tryCatch(getCoingeckoTokenIdList())
    if (error) {
      console.log('Error:::', error)
      throw new HTTPException(400, { message: 'Failed to get token ids' })
    }
    const id = data.find((d) => d.symbol === body.symbol.toLowerCase() && d.name === body.name)?.id ?? '';

    tokens.push({
      address: body.address,
      decimals: body.decimals,
      name: body.name,
      symbol: body.symbol,
      chain: Number(params.chainId),
      isTracked: true,
      isNative: false,
      cgId: id
    })
    const [updatedWalletTokens] = await db.update(wallet).set({
      tokens: tokens
    }).where(eq(wallet.id, chainWallet?.id!)).returning()
    console.log('Updated wallet:::', updatedWalletTokens)
    return c.json({
      success: true,
      message: 'Token added to wallet'
    })
  }
)

const updateTokenHandler = appFactory.createHandlers(
  zValidator('json', z.object({
    address: z.string().optional().nullable(),
    isNative: z.boolean().default(true),
    isTracked: z.boolean(),
    symbol: z.string(),
    chainId: z.string({ coerce: true }),
  })),
  async (c) => {
    // const params = c.req.valid('param')
    const body = c.req.valid('json')
    // console.log('Params:::', params)
    console.log('Body:::', body)
    const user = c.get('user')
    if (!user) throw new HTTPException(404, { message: 'User not found' })

    const userWallet = await getUserWithWallets(user.id)
    if (!userWallet) throw new HTTPException(404, { message: 'User wallets not found' })
    const chainWallet = userWallet.wallets.find((w) => w.chainId === body.chainId)
    let tokens = chainWallet?.tokens as WalletToken[]

    tokens = tokens.map((token) => {
      if (token.isNative === body.isNative && token.address === body.address) {
        return {
          ...token,
          isTracked: body.isTracked
        }
      }
      return token;
    })

    const [updatedWalletTokens] = await db.update(wallet).set({
      tokens: tokens
    }).where(eq(wallet.id, chainWallet?.id!)).returning()
    console.log('Updated wallet:::', updatedWalletTokens)

    return c.json({
      success: true,
      message: 'Token updated successfully'
    })
  }
)

const checkTokenAddress = appFactory.createHandlers(
  zValidator('param', z.object({
    chainId: z.string()
  })),
  zValidator('json', z.object({
    address: z.string().min(3)
  })),
  async (c) => {
    const body = c.req.valid('json')
    const params = c.req.valid('param')
    const user = c.get('user')
    if (!user) throw new HTTPException(404, { message: 'User not found' })
    const userWallet = await getUserWithWallets(user.id)

    const wallet = userWallet?.wallets.find((w) => w.chainId === params.chainId)
    if (!wallet) throw new HTTPException(404, { message: 'Wallet with chain ID not found' })
    const nexusClient = await getNexusClient(wallet.privateKey as Hex, Number(wallet?.chainId), false)
    const { data, error } = await tryCatch(getTokenData(nexusClient, body.address as Hex))
    if (error) {
      logger.error(error);
      throw new HTTPException(400, { message: 'Failed to get token data' })
    }

    return c.json({
      success: true,
      message: 'Token data returned',
      data
    })
  }
)

const getMarketDataHandler = appFactory.createHandlers(
  async (c) => {
    try {
      const {data, error} = await tryCatch(getCoingeckoMarketData([
        'bitcoin',
        'ethereum',
        'uniswap',
        'ripple',
        'binancecoin',
        'solana',
        'usd-coin',
        'dogecoin',
        'cardano',
        'tron'
      ]))
      if(error) throw new HTTPException(500, {message: 'Failed to get market data'})

      return c.json({
        success: true,
        message: 'Market data returned',
        data
      })
    }
    catch(error: any) {
       logger.error(error, ':::Market data') 
       throw new HTTPException(500, {message: 'Failed to get market data'})
    }
  }
)


walletRoute.get('/', ...getWallet);

walletRoute.get('/assets', ...getUserAssets);

walletRoute.post('/create', ...createWalletHandler);
walletRoute.put('/backup', ...backupWallet);
walletRoute.route('/transaction', transactionRoute);

walletRoute.route('/network', networkRoute);

walletRoute.get('/:chainId/:symbol/info', ...getAssetsInfo)
walletRoute.post('/:chainId/check-token', ...checkTokenAddress)
walletRoute.post('/:chainId/add-token', ...addTokenHandler)
walletRoute.put('/update-token', ...updateTokenHandler)

// market
walletRoute.get('/market-data', ...getMarketDataHandler)

export { walletRoute };

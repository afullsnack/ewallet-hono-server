import { HTTPException } from "hono/http-exception";
import { logger } from "../../middlewares/logger";
import appFactory from "../../app";
import { updateUserHandlers } from "./update";
import { getUserWithWallets } from "../../db";
import { getBalance } from "src/_lib/biconomy/client.mts";
import { Address } from "viem";
import { tryCatch } from "src/_lib/try-catch";

const userRoute = appFactory.createApp();

// middleware to check request is by authorized user
userRoute.use(async (c, next) => {
  const session = c.get('session');
  if (!session) {
    throw new HTTPException(401, { message: 'Unauthorized to access this route' });
  }
  await next();
});

// get user with current session
const getUserHandlers = appFactory.createHandlers(async (c) => {
  const session = c.get('session');
  if (!session) {
    throw new HTTPException(404, { message: 'User session not found' });
  }
  const user = await getUserWithWallets(session.userId)
  if (!user) throw new HTTPException(404, { message: 'User was not found in db' });

  return c.json({ user }, 200);
})

const getUserBalance = appFactory.createHandlers(async (c) => {
  const session = c.get('session');
  if (!session) {
    throw new HTTPException(404, { message: 'User session not found' });
  }
  const user = await getUserWithWallets(session.userId)
  if (!user) throw new HTTPException(404, { message: 'User was not found in db' });

  let balance: number = 0;
  if (user?.wallets.length) {
    const { data, error } = await tryCatch(getBalance(84532, user?.wallets[0]?.address! as Address))
    logger.error(error)
    logger.info("balance:::", balance)
    if(data) balance = data;
  }

  const usdBalance = balance*1963;
  const assets = [
    {
        title: 'Base',
        exchange: 0.08,
        asset: balance,
        slug: 'ETH',
        pip: usdBalance,
        signal: 0.31

    }
  ]

  return c.json({ balance: usdBalance, assets, network: 'USD' }, 200)
})

userRoute.post('/update', ...updateUserHandlers);
userRoute.get('/me', ...getUserHandlers);
userRoute.get('/balance', ...getUserBalance)

export { userRoute };

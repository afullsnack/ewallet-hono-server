
import { HTTPException } from "hono/http-exception";
import appFactory from "../../app";
import { createWalletHandler } from "./create";
import { recoverWalletHandler } from "./recover";

const walletRoute = appFactory.createApp();

walletRoute.use(async (c, next) => {
  const session = c.get('session');
  if(!session) throw new HTTPException(401, {message: 'Unauthorized access'});
  await next();
})

walletRoute.post('/create', ...createWalletHandler);
walletRoute.post('/recover', ...recoverWalletHandler);

export { walletRoute };

// initialise default app factory with db, cache, etc, services
// import { Hono } from 'hono'
import { createFactory } from "hono/factory";
import {
  createUserWithWallet,
  updateUser,
  updateWallet,
  addWalletToUser,
  deleteUserAndWallets,
} from "./db/index";
import {auth} from "./_lib/shared/auth"
import { env } from "hono/adapter";
import { Context } from "hono";
import { logger } from "./middlewares/logger";

export type Env = {
  Bindings: {
    POSTGRES_DB_URL: string;
    REDIS_CONNECTION_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    KEY_SHARES: number;
    KEY_THRESHOLD: number;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  },
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
    dbRepo: {
      createUserWithWallet: typeof createUserWithWallet;
      updateUser: typeof updateUser;
      updateWallet: typeof updateWallet;
      addWalletToUser: typeof addWalletToUser;
      deleteUserAndWallets: typeof deleteUserAndWallets;
    }
  }
}
const app = createFactory<Env>({
  // init app with dbRepo
  // NOTE: update to use user service, cache config
  initApp(app) {
    app.use(async (c, next) => {
      try {
      const envs = env<{
        POSTGRES_DB_URL: string;
        KEY_SHARES: string;
        KEY_THRESHOLD: string;
      }, Context<Env>>(c, 'node');
      c.env = {
        ...envs,
        KEY_SHARES: Number(envs.KEY_SHARES),
        KEY_THRESHOLD: Number(envs.KEY_THRESHOLD)
      };
      c.set('dbRepo', {
        createUserWithWallet,
        updateUser,
        updateWallet,
        addWalletToUser,
        deleteUserAndWallets,
      });

      await next();
        
      } catch(error:any) {
        logger.fatal(error);
      }
    })
  },
})

export default app;


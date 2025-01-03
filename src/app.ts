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
import { env } from "hono/adapter";
import { Context } from "hono";

export type Env = {
  Bindings: {
    DB_FILE_NAME: string;
    KEY_SHARES: number;
    KEY_THRESHOLD: number;
  },
  Variables: {
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
      const envs = env<{
        DB_FILE_NAME: string;
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
    })
  },
})

export default app;


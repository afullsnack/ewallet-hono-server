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

export type Env = {
  Bindings: {
    DB_FILE_NAME: string;
    KEY_SHARES: number;
    KEY_THRESHOLD: number;
    LOGTO_APP_ID: string;
    LOGTO_APP_SECRET: string;
    LOGTO_APP_ENDPOINT: string;
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

      // set session
      const session = await auth.api.getSession({ headers: c.req.raw.headers });

      if(!session) {
        c.set('user', null);
        c.set('session', null);
        return await next();
      }

      c.set('user', session.user);
      c.set('session', session.session);
      await next();
    })
  },
})

export default app;


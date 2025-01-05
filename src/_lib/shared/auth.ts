import LogtoClient from "@logto/node/edge";
import { LogtoConfig, CookieStorage } from "@logto/node";
import { logger } from "../../middlewares/logger";
import type { Context } from "hono";
import {setCookie, getCookie} from "hono/cookie";
import { Env } from "../../app";

export const authConfig: LogtoConfig = {
  endpoint: process.env.LOGTO_APP_ENDPOINT!,
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
} satisfies LogtoConfig;


interface ILogtoService {
  register({
    username,
    email,
    password,
  }: { username: string; email: string; password: string; }): Promise<any>;
  login({ email, password }: { email: string; password: string; }): Promise<any>
}
export class LogtoAuthAdapter implements ILogtoService {
  private client: LogtoClient;
  constructor(c: Context<Env>) {
    const storage = new CookieStorage({
      encryptionKey: 'oscaosdcbobasc',
      getCookie(name) {
        logger.info(name, 'get-cookie-name');
        return getCookie(c, name);
      },
      setCookie(name, value, options) {
        logger.info(name, value, options, 'set-cookie-fields');
        setCookie(c, name, value, {
          path: '/',
          secure: process.env.NODE_ENV !== 'development',
          expires: new Date(Date.now() * 3600),
        });
      },
    });
    this.client = new LogtoClient(authConfig, { storage } as any);
  }

  async register({ username, email, password }: { username: string; email: string; password: string; }): Promise<{}> {
    logger.info(username, email, password);
    return Promise.all([]);
  }

  async login({ email, password }: { email: string; password: string; }): Promise<any> {
    logger.info(email, password);
    const [userinfo, accessToken] = await Promise.all([
      this.client.fetchUserInfo(),
      this.client.getAccessToken(),
    ]);
    return [userinfo, accessToken];
  }
  get getConfig() {
    return this.client.logtoConfig;  
  }
}

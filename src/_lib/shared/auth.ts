import LogtoClient, { PersistKey } from "@logto/node/edge";
import { LogtoConfig, CookieStorage, ClientAdapter } from "@logto/node";
import { logger } from "../../middlewares/logger";

export const authConfig: LogtoConfig = {
  endpoint: ``,
  appId: ``,
  appSecret: ``
} satisfies LogtoConfig;

const storage = new CookieStorage({
  encryptionKey: 'oscaosdcbobasc',
  getCookie(name) {
    return `${name}-cookie data`;
  },
  setCookie(name, value, options) {
    logger.info(name, value, options, 'set-cookie');
    throw new Error(`Not yet implemented`);
  },
});
export const client = new LogtoClient(authConfig, { storage } as any);

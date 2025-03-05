import {HTTPException} from "hono/http-exception";
import { logger } from "src/middlewares/logger";
import appFactory from "../../app";
import {updateUserHandlers} from "./update";

const userRoute = appFactory.createApp();

userRoute.use(async (c, next) => {
  const session = c.get('session');
  logger.info(session, ":::session");
  if(!session) {
    throw new HTTPException(401, {message: 'Unauthorized to access this route'});
  }
  await next();
});

userRoute.post('/update', ...updateUserHandlers);

export { userRoute };

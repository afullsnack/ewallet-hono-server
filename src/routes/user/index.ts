import { HTTPException } from "hono/http-exception";
import { logger } from "../../middlewares/logger";
import appFactory from "../../app";
import { updateUserHandlers } from "./update";
import { getUserWithWallets } from "../../db";
import { auth } from "src/_lib/shared/auth";

const userRoute = appFactory.createApp();

userRoute.use(async (c, next) => {
  const session = c.get('session');
  if(!session) {
    throw new HTTPException(401, {message: 'Unauthorized to access this route'});
  }
  await next();
});

// get user
const getUserHandlers = appFactory.createHandlers(async (c) => {
  const session = c.get('session');
  if (!session) {
    throw new HTTPException(404, { message: 'User not found' });
  }
  const fetchUser = await getUserWithWallets(session.userId)

  return c.json(fetchUser, 200);
})

userRoute.post('/update', ...updateUserHandlers);
userRoute.get('/me', ...getUserHandlers);

export { userRoute };

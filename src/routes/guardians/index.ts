import { HTTPException } from "hono/http-exception";
import appFactory from "../../app";
import { guardian as guardianCreation } from "./create";
import {guardianRecovery} from "./recover"
import { db, getUserWithWallets } from "src/db";

const guardianRoute = appFactory.createApp();

// return list of guardians for user
guardianRoute.get('/', async (c) => {
  const user = c.get('user')
  if(!user) throw new HTTPException(401, {message: 'You are not authorised to access this route'})

  const userReq = await getUserWithWallets(user.id)
})

guardianRoute.route('/create', guardianCreation);
guardianRoute.route('/recover', guardianRecovery);

export { guardianRoute };

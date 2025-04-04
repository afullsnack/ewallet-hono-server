import { HTTPException } from "hono/http-exception";
import appFactory from "../../app";
import { guardian as guardianCreation } from "./create";
import {guardianRecovery} from "./recover"
import { db, getUserWithWallets } from "src/db";

const guardianRoute = appFactory.createApp();

// TODO: return list of user guardians and guarding requests
guardianRoute.get('/', async (c) => {
  const user = c.get('user')
  if(!user) throw new HTTPException(401, {message: 'You are not authorised to access this route'})


  const guardians = db.query.guardRequestTable.findMany({
    where: ((guard, {eq}) => eq(guard.requestorId, user.id))
  })

  console.log('Guardians:::', guardians)

  const response = {
    success: true,
    message: 'Guardians and guarding retrieved',
    data: {
      guardians: {},
      guarding: {}
    }
  }
  return c.json({
    
  })
})

guardianRoute.route('/create', guardianCreation);
guardianRoute.route('/recover', guardianRecovery);

export { guardianRoute };

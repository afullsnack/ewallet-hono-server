import appFactory from "../../app";
import { zValidator } from "@hono/zod-validator"; 
import { HTTPException } from "hono/http-exception";
import { getUserWithEmailOrUsername } from "src/db";
import {z} from "zod";

const guardianRecovery = appFactory.createApp();


// TODO: make routes for the recovery flow
// guardianRecovery.post(
//   '/user-email',
//   zValidator('json', z.object({
//     email: z.string().email()
//   })),
//   async (c) => {
//     const body = c.req.valid('json')
//     const response = {
//       success: true,
//       message: 'Verificatio code sent',
//     }
//     return c.json(response)
//   }
// )

guardianRecovery.post(
  '/emails',
  zValidator('json', z.object({
    guardianEmailOrUsername: z.union([z.string().email(), z.string()]),
    userEmail: z.union([z.string().email(), z.string()])
  })),
  async (c) => {
    const body = c.req.valid('json')

    const user = await getUserWithEmailOrUsername(body.userEmail)
    if(!user) throw new HTTPException(404, {message: 'User not found with email'})

    const guardian = await getUserWithEmailOrUsername(body.guardianEmailOrUsername)
    if(!guardian) {
      throw new HTTPException(404, {message: 'Guardian not found'})
    }

    // check that guardian account is a guardian of the user requesting recovery

    const response = {
      success: true,
      message: 'Code verified successful',
    }
    return c.json(response)
  }
)

guardianRecovery.post(
  '/verify-guardian-code',
  zValidator('json', z.object({
    guardCode: z.string().email()
  })),
  async (c) => {
    // TODO: verify the 2 digit number code sent to the guardian
    const body = c.req.valid('json')

    const response = {
      success: true,
      message: 'Verificatio code sent',
    }
    return c.json(response)
  }
)

guardianRecovery.post(
  '/confirm-recovery',
  // zValidator('json', z.object({
  //   email: z.string().email()
  // })),
  async (c) => {
    // TODO: confirm the recovery and restore users account

    const response = {
      success: true,
      message: 'Verificatio code sent',
      code: '000000'
    }
    return c.json(response)
  }
)

export {guardianRecovery};

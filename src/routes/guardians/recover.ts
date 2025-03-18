import appFactory from "../../app";
import { zValidator } from "@hono/zod-validator"; 
import { HTTPException } from "hono/http-exception";
import { getUserWithEmailOrUsername } from "src/db";
import {z} from "zod";

const guardianRecovery = appFactory.createApp();


// TODO: make routes for the recovery flow
guardianRecovery.post(
  '/send-code',
  zValidator('json', z.object({
    email: z.string().email()
  })),
  async (c) => {
    const body = c.req.valid('json')

    const user = await getUserWithEmailOrUsername(body.email)
    if(!user) throw new HTTPException(404, {message: 'User not found with email'})

    const response = {
      success: true,
      message: 'Verificatio code sent',
      code: '000000'
    }
    return c.json(response)
  }
)

guardianRecovery.post(
  '/verify-code',
  zValidator('json', z.object({
    code: z.string().length(6)
  })),
  async (c) => {
    const body = c.req.valid('json')

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
    const body = c.req.valid('json')

    const response = {
      success: true,
      message: 'Verificatio code sent',
      code: '000000'
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
    // const body = c.req.valid('json')

    const response = {
      success: true,
      message: 'Verificatio code sent',
      code: '000000'
    }
    return c.json(response)
  }
)

export {guardianRecovery};

import appFactory from "../../app";
import { zValidator } from "@hono/zod-validator";
import {z} from "zod"

const guardian = appFactory.createApp();

guardian.use(async (c, next) => {
  // TODO: middleware to block or filter requests
  await next();
})

guardian.post(
  '/email',
  zValidator('json', z.object({
    email: z.string().email()
  })),
  async (c) => {
    // TODO: confirm guardian or user email address

    return c.json({
      success: true,
      message: 'Email confirmed!',
    })
  }
)

export { guardian };

import appFactory from "../../app";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { db, getUserWithEmailOrUsername } from "src/db";
import { guardRequestTable } from "src/db/schema";
import { z } from "zod"

const guardian = appFactory.createApp();

guardian.use(async (c, next) => {
  // TODO: middleware to block or filter requests
  await next();
})


// TODO: steps in creating a guardian
// - Verify owner email
// - Enter verification code
//   - Resend code
//   - Verify code
// - Add guardian email, return address if guardian has a wallet
// - Confirm guardian email added
//   - Return current guardian list

guardian.post(
  '/send-code',
  zValidator('json', z.object({
    email: z.string().email()
  })),
  async (c) => {
    // TODO: send code to provided email address
    // Track code with HOTP scheme
    // Hit same endpoint to resend code
    const response = {
      success: true,
      message: 'Verification code sent',
      code: '000000'
    }
    return c.json(response)
  }
)


guardian.post(
  '/verify-code',
  zValidator('json', z.object({
    code: z.string().length(6)
  })),
  async (c) => {
    const body = c.req.valid('json')
    // TODO: send code to provided email address
    // Track code with HOTP scheme
    // Hit same endpoint to resend code
    let response: Record<string, any>;
    if (body.code === '000000') {
      response = {
        success: true,
        message: 'Email verified successfully',
        code: '000000'
      }
    } else {
      response = {
        success: false,
        message: 'Invalid code please try again',
      }
    }
    return c.json(response)
  }
)

guardian.post(
  '/check-guardian',
  zValidator('json', z.object({
    email: z.string().email()
  })),
  async (c) => {
    const body = c.req.valid('json')
    // TODO: check if the provided guardian email exists

    const user = await db.query.user.findFirst({
      where: ((user, { eq }) => eq(user.email, body.email)),
      with: {
        wallets: true
      }
    });

    let response: Record<string, any>;
    if (!user) {
      throw new HTTPException(404, { message: 'Guardian with email not found' })
    } else {
      response = {
        success: true,
        message: 'Guardian found',
        address: user.wallets.find((w) => w.network === 'evm')?.address ?? 'not-created'
      }
    }

    return c.json(response)
  }
)

guardian.post(
  '/confirm-guardian',
  zValidator('json', z.object({
    email: z.string().email()
  })),
  async (c) => {
    const body = c.req.valid('json')
    // TODO: add guardian to users guardian request list
    const user = c.get('user')
    if(!user) throw new HTTPException(404, {message: 'User not authorised to make this request'})

    const guardian = await getUserWithEmailOrUsername(body.email);
    if(!guardian) throw new HTTPException(404, {message: 'Guardain not found'})

    const [newGuardianRequest] = await db.insert(guardRequestTable)
      .values({
        requestorId: user.id,
        guardianId: guardian.id
      }).returning();

    // TODO: send email/notification for guardian to accept or reject request

    let response: Record<string, any> = {
      success: true,
      message: 'Guardain request sent',
      data: newGuardianRequest
    }

    return c.json(response)
  }
)

export { guardian };

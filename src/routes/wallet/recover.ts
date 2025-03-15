// recover wallet with qr-code
import appFactory from "../../app";
import { effectValidator } from "@hono/effect-validator";
import { Schema } from "@effect/schema";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator"
import { WalletContext } from "src/_lib/chains/wallet.context";
import { createRecoveryRequest, getUserWithEmail, getUserWithWallets } from "src/db";
import { HTTPException } from "hono/http-exception";
// import { validator } from "hono/validator";
// import parseDataURL from "data-urls";
// import {labelToName, decode} from "whatwg-encoding"


export const recoveryRoute = appFactory.createApp();

// get account by email

/*
  The different stages of recovery
  - Choice: guardian, qr-code
  - QR-Code: Enter account email
    - Scan, Upload QR-Code
    - Enter encryption password
    - Verify email with OTP
    - Create account pin
*/


recoveryRoute.post(
  '/account-email',
  zValidator('json', z.object({
    email: z.string().email()
  })),
  async (c) => {
    const body = c.req.valid('json')

    const user = await getUserWithEmail(body.email)

    if(!user) throw new HTTPException(500, {message: 'User not found!'})
    
    const recoveryRequest = await createRecoveryRequest(user?.id)

    // @ts-ignore
    return c.json({
      success: true,
      message: 'Account retrrieved!',
      requestId: recoveryRequest?.id,
    })
  }
)



const Body = Schema.Struct({
  password: Schema.NonEmptyTrimmedString,
  qrCodeBase64Url: Schema.NonEmptyTrimmedString,
  walletId: Schema.NonEmptyTrimmedString,
});

export const recoverWalletHandler = appFactory.createHandlers(
  effectValidator('json', Body),
  async (c) => {
    const body = c.req.valid('json');

    // steps - recover wallet
    const walletContext = new WalletContext('evm');
    const accounts = await walletContext.recoverAccount({
      password: body.password,
      walletId: body.walletId
    });


    return c.json({
      status: 'success',
      message: 'Recovered wallet',
      data: {
        // ...accounts
      }
    })
  }
)

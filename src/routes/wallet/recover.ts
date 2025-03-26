// recover wallet with qr-code
import appFactory from "../../app";
import { effectValidator } from "@hono/effect-validator";
import { Schema } from "@effect/schema";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator"
import { WalletContext } from "src/_lib/chains/wallet.context";
import { createRecoveryRequest, db, getUserWithEmailOrUsername, getUserWithWallets, updateWallet } from "../../db";
import { HTTPException } from "hono/http-exception";
import { logger } from "../../middlewares/logger"
import jsQR from "jsqr-es6"
import sharp from "sharp"
import { recoveryRequestTable } from "src/db/schema";
import { CryptoUtil } from "src/_lib/helpers/hasher";
import { eq } from "drizzle-orm";
import { defaultChainIds } from "../../_lib/utils";
import { tryCatch } from "src/_lib/try-catch";


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
  '/account',
  zValidator('json', z.object({
    emailOrUsername: z.union([z.string().email(), z.string().trim().min(3)])
  })),
  async (c) => {
    const body = c.req.valid('json')

    const user = await getUserWithEmailOrUsername(body.emailOrUsername)

    logger.info(user);

    if (!user) throw new HTTPException(404, { message: 'User not found!' })

    const recoveryRequest = await createRecoveryRequest(user?.id)

    // @ts-ignore
    return c.json({
      success: true,
      message: 'Account retrrieved!',
      requestId: recoveryRequest?.id,
    })
  }
)

recoveryRoute.post(
  '/scan-upload',
  // zValidator('json', z.object({

  // }))
  async (c) => {
    try {
      const body = await c.req.parseBody({ all: true })
      const qrData = body['qrCode'] as File
      const recoveryId = body['recoveryId'] ?? c.req.header('recovery-id')

      console.log(body, ":::body data", recoveryId)
      // const imageData = new Uint8ClampedArray((await qrData.arrayBuffer()))
      const { data, info } = await sharp((await qrData.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      logger.info(info, ":::sharp info")
      const code = jsQR(new Uint8ClampedArray(data.buffer), info.width, info.height)

      logger.info(code?.data, ":::code")
      await db.update(recoveryRequestTable)
        .set({keyData: code?.data})
        .where(eq(recoveryRequestTable.id, recoveryId as string))

      return c.json({
        success: true,
        message: 'Received qr-code scan!'
      })
    } catch (error: any) {
      logger.error(error)
      return c.json({
        success: false,
        message: error?.message
      })
    }
  }
)

recoveryRoute.post(
  '/decrypt',
  zValidator('json', z.object({
    password: z.string().min(4, 'Password must be longer than 4 digits'),
    recoveryId: z.string().min(10)
  })),
  async (c) => {
    const body = c.req.valid('json')
    console.log(body, ":::body")
    const recoverReq = await db.query.recoveryRequestTable.findFirst({
      where: ((req, {eq}) => eq(req.id, body.recoveryId))
    })
    if(!recoverReq) {
      logger.error('Recovery not found', recoverReq)
      throw new HTTPException(404, {message: 'Recovery request not found'})
    }

    const user = await getUserWithWallets(recoverReq.requestorId!)

    if(!user) {
      logger.error('User not found', user)
      throw new HTTPException(404, {message: 'User not found'})
    }

    if(!user?.wallets.length) {
      logger.error('No wallet', user.wallets)
      throw new HTTPException(404,{message: 'Wallet not created for user'})
    }

    const evmWalletPassword = user?.wallets.find((w) => w.network === 'evm')?.recoveryPassword;
    const evmWalletId = user?.wallets.find((w) => w.network === 'evm')?.id;
    const evmMnemonic = user?.wallets.find((w) => w.network === 'evm')?.mnemonic;

    if(!evmWalletPassword || !evmWalletId || !evmMnemonic) {
      throw new HTTPException(404, {message: 'Wallet password hash, id, and mnemonic not found'})
    }

    const isPassword = CryptoUtil.verify(evmWalletPassword, body.password)
    if(!isPassword) {
      logger.error('password match', isPassword)

      throw new HTTPException(401, {message: 'Password is invalid or incorrect'})
    }

    const {data, error} = await tryCatch(new Promise((resolve) => resolve(CryptoUtil.decrypt(evmMnemonic, body.password))));
    const mnemonic = error? evmMnemonic : data as string;
    console.log(mnemonic, ":::decrypted pnemonic")
    // const backup = Buffer.from(recoverReq.keyData!);
    // console.log(backup, ":::backup buffer")
    console.log(recoverReq.keyData, ":::backup buffer to string base64")
    const walletContext = new WalletContext('evm');
    const recovery = await walletContext.recoverAccount({
      backupShare: recoverReq.keyData!,
      password: body.password,
      walletId: evmWalletId,
      mnemonic,
    })
    logger.info("Recovery data:::", recovery)

    return c.json({
      success: true,
      message: 'QR Code decyrpted successfully!',
      address: recovery.address,
      email: user.email,
      username: user?.username
    })
  }
)

recoveryRoute.post(
  '/get-code',
  zValidator('json', z.object({
    email: z.string().email(),
  })),
  async (c) => {
    return c.json({
      success: true,
      message: 'Verification code sent!'
    })
  }
)

recoveryRoute.post(
  '/verify-code',
  zValidator('json', z.object({
    otpCode: z.string().length(6)
  })),
  async (c) => {
    const body = c.req.valid('json')
    console.log(body);

    if(body.otpCode === '000000') {
      return c.json({
        success:true,
        message: 'Code verification complete!',
      })
    }

    return c.json({
      success: false,
      message: 'Verification code verification failed',
    }, 400)
  }
)



// const Body = Schema.Struct({
//   password: Schema.NonEmptyTrimmedString,
//   qrCodeBase64Url: Schema.NonEmptyTrimmedString,
//   walletId: Schema.NonEmptyTrimmedString,
// });

// export const recoverWalletHandler = appFactory.createHandlers(
//   effectValidator('json', Body),
//   async (c) => {
//     const body = c.req.valid('json');

//     // steps - recover wallet
//     const walletContext = new WalletContext('evm');
//     const accounts = await walletContext.recoverAccount({
//       password: body.password,
//       walletId: body.walletId
//     });


//     return c.json({
//       status: 'success',
//       message: 'Recovered wallet',
//       data: {
//         // ...accounts
//       }
//     })
//   }
// )

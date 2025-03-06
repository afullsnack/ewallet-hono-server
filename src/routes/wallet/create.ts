import appFactory from "../../app";
import { effectValidator } from "@hono/effect-validator";
import { Schema } from "@effect/schema";
import { WalletContext } from "src/_lib/chains/wallet.context";
import { getWallet } from "../../db";
import QRCode from "qrcode";
import { HTTPException } from "hono/http-exception";

const Body = Schema.Struct({
  password: Schema.NonEmptyTrimmedString,
  mnemonic: Schema.optional(Schema.NonEmptyTrimmedString),
});

export const createWalletHandler = appFactory.createHandlers(
  effectValidator('json', Body),
  async (c) => {
    const user = c.get('user');
    if(!user) throw new HTTPException(404, {message: 'User not found'});

    const body = c.req.valid('json');
    // steps - create wallet
    // > convert localKey to string
    // > convert shareC to QRCode encoded URL
    const walletContext = new WalletContext('evm');
    const createResult = await walletContext.createAccount({
      password: body.password,
      userId: user?.id,
      mnemonic: body.mnemonic
    });

    const wallet = await getWallet(createResult.accountId);
    if(!wallet) throw new HTTPException(404, {message: 'Wallet not found or has not been created yet!'});
    const generateQR = async (value: string) => {
      try {
        QRCode.toString(value, {type: 'terminal'}, (err, url) => {
          console.error(err, ":::Error");
          console.log(url);
        })
        return await QRCode.toDataURL(value);
      }
      catch(error: any) {
        console.error(error, {action: 'generate-qrcode'});
        throw new Error('Failed to generate QR Code');
      }
    }

    // generate code if shareC exists
    const qrCode = wallet.shareC && await generateQR(wallet.shareC.toString('base64'));

    return c.json({
      status: 'success',
      message: 'Wallet created successfuly',
      data: {
        accountId: createResult.accountId,
        address: wallet.address,
        localKey: wallet.shareB && wallet.shareB.toString('base64'),
        qrCode,
      }
    }, 201);
  }
)

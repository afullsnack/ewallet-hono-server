import appFactory from "../../app";
import { effectValidator } from "@hono/effect-validator";
import { Schema } from "@effect/schema";
import { WalletContext } from "src/_lib/chains/wallet.context";
import { validator } from "hono/validator";
import { getWallet } from "../../db";
import QRCode from "qrcode";

const Body = Schema.Struct({
  password: Schema.NonEmptyTrimmedString,
  mnemonic: Schema.optional(Schema.NonEmptyTrimmedString),
});
const Header = Schema.Struct({
  userId: Schema.NonEmptyTrimmedString,
});

export const createWalletHandler = appFactory.createHandlers(
  effectValidator('json', Body),
  validator('header', (value, c) => {
    const userId = value['x-user-id'];

    return {
      userId,
    }
  }),
  async (c) => {
    const body = c.req.valid('json');
    const header = c.req.valid('header');
    console.log(header, ':::header', body, ':::body');

    // steps - create wallet
    // > convert localKey to string
    // > convert shareC to QRCode encoded URL
    const walletContext = new WalletContext('evm');
    const createResult = await walletContext.createAccount({
      password: body.password,
      userId: header.userId,
      mnemonic: body.mnemonic
    });

    const account = await getWallet(createResult.accountId);
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

    const qrCode = await generateQR(account.shareC.toString('base64'));

    return c.json({
      status: 'success',
      message: 'Wallet created successfuly',
      data: {
        accountId: createResult.accountId,
        address: account.address,
        localKey: account.shareB.toString('base64'),
        qrCode,
        qnum: account.shareC.toString('base64')
      }
    }, 201);
  }
)

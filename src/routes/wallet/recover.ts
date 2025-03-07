// recover wallet with qr-code
import appFactory from "../../app";
import {effectValidator} from "@hono/effect-validator";
import { Schema } from "@effect/schema";
import { WalletContext } from "src/_lib/chains/wallet.context";
import { validator } from "hono/validator";
import parseDataURL from "data-urls";
import {labelToName, decode} from "whatwg-encoding"

const Body = Schema.Struct({
  password: Schema.NonEmptyTrimmedString,
  qrCodeBase64Url: Schema.NonEmptyTrimmedString,
  walletId: Schema.NonEmptyTrimmedString,
});

export const recoverWalletHandler = appFactory.createHandlers(
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
    // const regex = /^data:.+\/(.+);base64,(.*)$/;

    // const matches = body.qrCodeBase64Url.match(regex);

 // var arr = body.qrCodeBase64Url.split(","),
 //      mime = arr[0].match(/:(.*?);/)[1],
 //      bstr = atob(arr[arr.length - 1]),
 //      n = bstr.length,
 //      u8arr = new Uint8Array(n);
 //    while (n--) {
 //      u8arr[n] = bstr.charCodeAt(n);
 //    }
 //    const file = new File([u8arr], 'qrcode', { type: mime });
    // const dataUrl = parseDataURL(body.qrCodeBase64Url);
    // const encodingName = labelToName(dataUrl.mimeType.parameters.get('charset') || 'utf-8');
    // const bodyDecoded = decode(dataUrl.body, 'utf-8');

    // console.log(bodyDecoded, ":::decoded body");
    
    // const qrCodeParser = await import("qrcode-parser").then((value) => value.default);

    // const base64BackupShare = await qrCodeParser(file);
    // console.log(base64BackupShare, ":::b64 backup share");

    // steps - recover wallet
    const walletContext = new WalletContext('evm');
    const accounts = await walletContext.recoverAccount({
      password: body.password,
      backupShare: Buffer.from(body.qnum, 'base64'),
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

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

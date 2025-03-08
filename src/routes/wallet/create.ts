import appFactory from "../../app";
import { effectValidator } from "@hono/effect-validator";
import { Schema } from "@effect/schema";
import { WalletContext } from "src/_lib/chains/wallet.context";
import { HTTPException } from "hono/http-exception";

const Body = Schema.Struct({
  password: Schema.NonEmptyTrimmedString,
  // mnemonic: Schema.optional(Schema.NonEmptyTrimmedString),
  // network: Schema.optional(Schema.Union(
  //   Schema.Literal('evm'),
  //   Schema.Literal('btc'),
  //   Schema.Literal('solana')
  // ))
});

export const createWalletHandler = appFactory.createHandlers(
  effectValidator('json', Body),
  async (c) => {
    const user = c.get('user');
    if(!user) throw new HTTPException(404, {message: 'User not found'});

    const body = c.req.valid('json');
    // steps - create wallet
    const walletContext = new WalletContext('evm');
    const createResult = await walletContext.createAccount({
      password: body.password,
      userId: user?.id,
      // mnemonic: body.mnemonic
    });

    // const wallet = await getWallet(createResult.accountId);
    // if(!wallet) throw new HTTPException(404, {message: 'Wallet not found or has not been created yet!'});

    return c.json({
      status: 'success',
      message: 'Wallet created successfuly',
      data: {
        accountId: createResult.accountId,
        address: createResult.address,
      }
    }, 201);
  }
)

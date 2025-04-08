import { db, getUserWithWallets, getWalletWithUser } from "../../db";
import app from "../../app"
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { Address, formatEther, fromHex, Hex, isAddress, parseEther, parseUnits } from "viem";
import { getNexusClient, getTransactionEstimate, sendTransaction } from "../../_lib/biconomy/client.mts";
import { transaction as transactionTable } from "../../db/schema";
import { tryCatch } from "src/_lib/try-catch";
import { getQuoteAndExecute, TokenSymbol } from "src/_lib/uniswap/swap.route";
import { WalletToken } from "src/_lib/utils";
import { getExplorerTxLink } from "@biconomy/abstractjs";

const transactionRoute = app.createApp();



transactionRoute.get('/', zValidator('header', z.object({id: z.string().optional().nullable()})), async (c) => {
  const param = c.req.valid('header')
  const id = c.req.header('transaction-id');

  console.log(param, 'param', c.req.header('transaction-id'))
  const user = c.get('user')
  if (!user) throw new HTTPException(404, { message: 'User not found' })
  const transactions = await db.query.transaction.findMany({
    where: ((transaction, { eq, and }) => id
      ? and(eq(transaction.sender, user?.id!), eq(transaction.id, param.id ?? id))
      : eq(transaction.sender, user?.id!))
  })

  const transaction = {
    ...transactions[0],
    explorerUrl: getExplorerTxLink(transactions[0]?.hash as Hex, Number(transactions[0]?.chainId))
  }

  return c.json({
    success: true,
    message: 'Transaction retrieved',
    transaction,
  })
})


transactionRoute.post(
  '/send/init',
  zValidator('json', z.object({
    address: z.string().startsWith('0x'),
    amount: z.number({ coerce: true }),
    chainId: z.number({ coerce: true }),
    symbol: z.string(),
    memo: z.string().optional().nullable()
  })),
  async (c) => {
    const body = c.req.valid('json')
    const user = c.get('user')
    if(!user) throw new HTTPException(404, {message: 'User not found'})
    console.log(body, ":::init body")

    // if (body.chainId !== 84532) throw new HTTPException(400, { message: 'Bad transaction request, chain ID not supported' })
    if (body.amount <= 0) throw new HTTPException(400, { message: 'Amount must be greater than 0' })
    if (!isAddress(body.address)) throw new HTTPException(400, { message: 'Address is not valid' })

    const userWithWallet = await getUserWithWallets(user?.id!)
    if (!userWithWallet) throw new HTTPException(404, { message: 'User not found' })

    const wallet = userWithWallet.wallets.find((w) => w.chainId === body.chainId.toString())
    const token = (wallet?.tokens as WalletToken[]).find((t) => t.symbol===body.symbol && t.chain.toString() === body.chainId.toString())
    // const chainId = 84532;
    const pk = userWithWallet.wallets[0]?.privateKey as Address;
    const nexusClient = await getNexusClient(pk, body.chainId, body.chainId===84532)
    const { info, receiver } = await getTransactionEstimate(nexusClient, body.address, token?.isNative? parseEther(body.amount.toString(), 'wei') : parseUnits(body.amount.toString(), token?.decimals!), token?.isNative, token?.address as Address)
    if (!info) throw new HTTPException(400, { message: 'Transaction info not found' })

    const [trxInsert] = await db.insert(transactionTable)
      .values({
        chainId: body.chainId.toString(),
        sender: user?.id,
        type: 'transfer',
        token: body.symbol,
        network: 'evm',
        receiver: body.address,
        amount: body.amount.toString(),
        userId: user.id,
        feePaidBy: (body.chainId !== 84532)? 'User' : 'EnetWallet'
      }).returning()

    const gasLimit = typeof info.callGasLimit === 'string'? fromHex(info.callGasLimit, "bigint") : info.callGasLimit;
    const gasFeeEstimate = Number(formatEther(gasLimit*info.maxPriorityFeePerGas, 'wei'))
    console.log(gasFeeEstimate, ":::esitmate", gasLimit, 'To fixed', gasFeeEstimate.toFixed(12))
    return c.json({
      success: true,
      message: 'Transaction estimation',
      gasFee: gasFeeEstimate.toFixed(12),
      receiver: body.address,
      amount: body.amount,
      paidBy: trxInsert?.feePaidBy,
      transactionId: trxInsert?.id
    })
  }
)

transactionRoute.post(
  '/send/confirm',
  zValidator('json', z.object({
    transactionId: z.string().min(10)
  })),
  async (c) => {
    const body = c.req.valid('json')
    const user = c.get('user')
    console.log(body, ":::confirm body")
    const userWithWallet = await getUserWithWallets(user?.id!)
    if (!userWithWallet) throw new HTTPException(404, { message: 'User not found' })

    const transaction = await db.query.transaction.findFirst({
      where: ((tran, { eq }) => eq(tran.id, body.transactionId))
    })
    if (!transaction) throw new HTTPException(404, { message: 'Transaction not found, kindly retry' })
    const wallet = userWithWallet.wallets.find((w) => w.chainId === transaction.chainId)
    const token = (wallet?.tokens as WalletToken[]).find((t) => t.symbol===transaction.token && t.chain.toString() === transaction.chainId)
    const pk = wallet?.privateKey as Address;
    const chainId = Number(transaction.chainId);
    const nexusClient = await getNexusClient(pk, chainId, true)

    const { data, error } = await tryCatch(sendTransaction(
      nexusClient,
      transaction.receiver as Address,
      token?.isNative? parseEther(transaction.amount!, 'wei') : parseUnits(transaction.amount!, token?.decimals!),
      token?.isNative,
      token?.address as Hex
    ))
    if (error) {
      await db.update(transactionTable)
        .set({ status: 'failed' })
        .returning()

      throw new HTTPException(500, { message: 'Transaction failed' })
    }

    const { hash, receiver, receipt } = data;
    const [updatedTx] = await db.update(transactionTable)
      .set({ hash, status: 'complete', fee: formatEther((receipt?.cumulativeGasUsed) * (receipt.effectiveGasPrice), 'wei') })
      .returning()

    return c.json({
      success: true,
      message: 'Transaction sent',
      updatedTx
    })
  }
)


transactionRoute.post(
  '/swap',
  zValidator('json', z.object({
    tokenInSymbol: z.string(),
    tokenOutSymbol: z.string(),
    tokenInAmount: z.string(),
    execute: z.boolean().default(false)
  })),
  async (c) => {
    const body = c.req.valid('json');
    const sessionUser = c.get('user')
    if(!sessionUser) {
      throw new HTTPException(404, {message: 'Session user not found'})
    }

    const userWallet = await getUserWithWallets(sessionUser.id)

    if(!body.execute) {
      const result = await getQuoteAndExecute({
        tokenInSymbol: body.tokenInSymbol as TokenSymbol,
        tokenOutSymbol: body.tokenOutSymbol as TokenSymbol,
        tokenInAmount: body.tokenInAmount,
        execute: body.execute,
        address: userWallet?.wallets[0]?.address!,
        userPK: userWallet?.wallets[0]?.privateKey! as Hex
      })

      return c.json({
        success: false,
        message: 'Swap quote gotten',
        result
      })
    }
  }
)


export { transactionRoute }

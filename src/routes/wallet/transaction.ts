import { db, getUserWithWallets, getWalletWithUser } from "../../db";
import app from "../../app"
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { Address, formatEther, isAddress, parseEther } from "viem";
import { getNexusClient, getTransactionEstimate, sendTransaction } from "../../_lib/biconomy/client.mts";
import { transaction as transactionTable } from "../../db/schema";
import { status } from "effect/Fiber";
import { tryCatch } from "src/_lib/try-catch";

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

  return c.json({
    success: true,
    message: 'Transaction retrieved',
    transactions
  })
})


transactionRoute.post(
  '/send/init',
  zValidator('json', z.object({
    address: z.string().startsWith('0x'),
    amount: z.number({ coerce: true }),
    chainId: z.number({ coerce: true }),
    memo: z.string().optional().nullable()
  })),
  async (c) => {
    const body = c.req.valid('json')
    const user = c.get('user')

    console.log(body, ":::init body")

    if (body.chainId !== 84532) throw new HTTPException(400, { message: 'Bad transaction request, chain ID not supported' })
    if (body.amount <= 0) throw new HTTPException(400, { message: 'Amount must be greater than 0' })
    if (!isAddress(body.address)) throw new HTTPException(400, { message: 'Address is not valid' })

    const userWithWallet = await getUserWithWallets(user?.id!)
    if (!userWithWallet) throw new HTTPException(404, { message: 'User not found' })

    const chainId = 84532;
    const pk = userWithWallet.wallets[0]?.privateKey as Address;
    const nexusClient = await getNexusClient(pk, body.chainId ?? chainId, true)
    const { info, receiver } = await getTransactionEstimate(nexusClient, body.address, parseEther(body.amount.toString(), 'wei'))
    if (!info) throw new HTTPException(400, { message: 'Transaction info not found' })

    const [trxInsert] = await db.insert(transactionTable)
      .values({
        chainId: chainId.toString(),
        sender: user?.id,
        network: 'evm',
        receiver: body.address,
        amount: body.amount.toString(),
        // fee: formatEther(info.callGasLimit, 'wei'),
        feePaidBy: 'EnetWallet'
      }).returning()

    const gasFeeEstimate = Number(formatEther(info.callGasLimit, 'wei'))*Number(formatEther(info.maxPriorityFeePerGas, 'wei'))
    console.log(gasFeeEstimate, ":::esitmate")
    return c.json({
      success: true,
      message: 'Transaction estimation',
      gasFee: gasFeeEstimate,
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
    const pk = userWithWallet.wallets[0]?.privateKey as Address;
    const chainId = Number(transaction.chainId);
    const nexusClient = await getNexusClient(pk, chainId, true)

    const { data, error } = await tryCatch(sendTransaction(nexusClient, transaction.receiver as Address, parseEther(transaction.amount!, 'wei')))
    if (error) {
      await db.update(transactionTable)
        .set({ status: 'failed', token: 'BASE' })
        .returning()

      throw new HTTPException(500, { message: 'Transaction failed' })
    }

    const { hash, receiver, receipt } = data;
    const [updatedTx] = await db.update(transactionTable)
      .set({ hash, status: 'complete', token: 'BASE', fee: formatEther(receipt?.cumulativeGasUsed * receipt.effectiveGasPrice, 'wei') })
      .returning()

    return c.json({
      success: true,
      message: 'Transaction sent',
      updatedTx
    })
  }
)


export { transactionRoute }

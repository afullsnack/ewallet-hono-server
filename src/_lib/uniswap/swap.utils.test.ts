import { describe, test, expect, beforeEach } from "vitest"
import { CurrentConfig } from "./swap.utils"
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json"
import { Account, erc20Abi, formatEther, formatUnits, getContract, Hex, parseEther, parseUnits } from "viem"
import { getNexusClient } from "../biconomy/client.mts"
import { NexusClient } from "@biconomy/abstractjs"
import { privateKeyToAccount } from "viem/accounts"
import { router } from "./swap.route"
import JSBI from "jsbi"
import { CurrencyAmount, Percent, SWAP_ROUTER_02_ADDRESSES, TradeType } from "@uniswap/sdk-core"
import { SwapType } from "@uniswap/smart-order-router"
import { baseSepolia, base, bobSepolia } from "viem/chains"



describe("test Quote fetching", () => {
  let nexusClient: NexusClient;
  let prAccount: Account

  beforeEach(async () => {
    nexusClient = await getNexusClient(CurrentConfig.wallet.privateKey as Hex, base.id, false, true)
    // prAccount = privateKeyToAccount(`0x5975c9645ba8cfd89800db0ec057211f142fcad8c36366de99b5495aee9df2c8`)
  }, 1000 * 10)

  test.only("should test running  swap transaction", async () => {
    try {
      const bigIntAmount = JSBI.toNumber(JSBI.BigInt(parseUnits(CurrentConfig.tokens.amountIn.toString(), CurrentConfig.tokens.in.decimals).toString()));
      const amountIn = CurrencyAmount.fromRawAmount(
        CurrentConfig.tokens.in,
        bigIntAmount,
      )
      const slippagePercentage = 0.5
      const route = await router.route(
        amountIn,
        CurrentConfig.tokens.out,
        TradeType.EXACT_INPUT,
        {
          recipient: nexusClient.account.address,
          slippageTolerance: new Percent(Math.floor(slippagePercentage * 100), 10000),
          deadline: Math.floor(Date.now() / 1000 + 1800), // 30 minutes from now
          type: SwapType.SWAP_ROUTER_02
        }
      );

      if (!route || !route.methodParameters) {
        throw new Error('No route found');
      }
      const path = route.route[0].tokenPath.map((token) => token.address)
      const executionPath = route.route[0].poolIdentifiers.join(' -> ');
      console.log('path:::', path);
      console.log('Exe path:::', executionPath);
      // console.log('Raw Quote:::', formatEther(BigInt(route.route[0].rawQuote), 'wei'))
      console.log(route.quote.toFixed(CurrentConfig.tokens.out.decimals), "::quote")
      console.log(route.trade.priceImpact.toFixed(CurrentConfig.tokens.out.decimals), ":::price impact")

      const swapRouterAddress = SWAP_ROUTER_02_ADDRESSES(base.id) as Hex;
      const amount = parseUnits(CurrentConfig.tokens.amountIn.toString(), CurrentConfig.tokens.in.decimals);
      console.log(swapRouterAddress, amount, ":::approve function input")
      const approveGas = await nexusClient.estimateUserOperationGas({
        calls: [
          {
            abi: erc20Abi,
            functionName: 'approve',
            to: CurrentConfig.tokens.in.address as Hex,
            args: [
              swapRouterAddress,
              amount
            ]
          }
        ],
        maxFeePerGas: (await nexusClient.getGasFeeValues()).fast.maxFeePerGas,
        maxPriorityFeePerGas: (await nexusClient.getGasFeeValues()).fast.maxPriorityFeePerGas
      })
      console.log('Approve Gas:::', approveGas)
      const gas = await nexusClient.estimateUserOperationGas({
        calls: [{
          to: SWAP_ROUTER_02_ADDRESSES(base.id) as Hex,
          data: route.methodParameters?.calldata as `0x${string}`,
          value: route.methodParameters?.value ? BigInt(route.methodParameters.value.toString()) : BigInt(0),
        }],
        maxFeePerGas: (await nexusClient.getGasFeeValues()).fast.maxFeePerGas,
        maxPriorityFeePerGas: (await nexusClient.getGasFeeValues()).fast.maxPriorityFeePerGas
      })
      console.log('Gas:::', gas)

      // --------------------- call txs gas --------------------
      const hash = await nexusClient.sendTransaction({
        calls: [
          {
            abi: erc20Abi,
            functionName: 'approve',
            to: CurrentConfig.tokens.in.address as Hex,
            args: [
              swapRouterAddress,
              amount
            ]
          },
          {
            to: SWAP_ROUTER_02_ADDRESSES(base.id) as Hex,
            data: route.methodParameters?.calldata as `0x${string}`,
            value: route.methodParameters?.value ? BigInt(route.methodParameters.value.toString()) : BigInt(0),
          }
        ],
        maxFeePerGas: (await nexusClient.getGasFeeValues()).fast.maxFeePerGas,
        maxPriorityFeePerGas: (await nexusClient.getGasFeeValues()).fast.maxPriorityFeePerGas
      })
      console.log('Transaction hash:::', hash)
      const receipt = await nexusClient.waitForTransactionReceipt({ hash, timeout: 1000 * 100, retryCount: 10, confirmations: 5 })
      console.log('Receipt:::', receipt)

      // const swapHash = await nexusClient.sendTransaction({
      //   calls: [],
      //   maxFeePerGas: (await nexusClient.getGasFeeValues()).fast.maxFeePerGas,
      //   maxPriorityFeePerGas: (await nexusClient.getGasFeeValues()).fast.maxPriorityFeePerGas
      // });

      // console.log(swapHash, ":::swap hash");

      // // Wait for the transaction to be mined
      // const swapreceipt = await nexusClient.waitForTransactionReceipt({ hash: swapHash, timeout: 1000 * 100, retryCount: 10, confirmations: 10 });
      // console.log('SwapReceipt:::', swapreceipt)
    } catch (error: any) {
      console.log(error, ":::error")
    }

  }, { timeout: 1000 * 1000000 })
})

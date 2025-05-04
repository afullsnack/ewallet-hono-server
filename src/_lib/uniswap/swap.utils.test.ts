import { describe, test, expect, beforeEach } from "vitest"
import { CurrentConfig } from "./swap.utils"
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json"
import { Account, Address, decodeErrorResult, erc20Abi, formatEther, formatUnits, getContract, Hex, parseEther, parseUnits } from "viem"
import { getNexusClient } from "../biconomy/client.mts"
import { NexusClient, UniswapSwapRouterAbi } from "@biconomy/abstractjs"
import { privateKeyToAccount } from "viem/accounts"
import { router } from "./swap.route"
import JSBI from "jsbi"
import { CurrencyAmount, Percent, SWAP_ROUTER_02_ADDRESSES, TradeType } from "@uniswap/sdk-core"
import { FallbackTenderlySimulator, SwapType } from "@uniswap/smart-order-router"
import { baseSepolia, base, bobSepolia } from "viem/chains"



describe("test Quote fetching", () => {
  let nexusClient: NexusClient;
  let prAccount: Account

  beforeEach(async () => {
    nexusClient = await getNexusClient(CurrentConfig.wallet.privateKey as Hex, base.id, false)
    // prAccount = privateKeyToAccount(`0x5975c9645ba8cfd89800db0ec057211f142fcad8c36366de99b5495aee9df2c8`)
  }, 1000 * 10)

  test.only("should test running  swap transaction", async () => {
    try {
      const bigIntAmount = JSBI.toNumber(JSBI.BigInt(parseUnits(CurrentConfig.tokens.amountIn.toString(), CurrentConfig.tokens.in.decimals).toString()));
      const amountIn = CurrencyAmount.fromRawAmount(
        CurrentConfig.tokens.in,
        bigIntAmount,
      )
      const slippagePercentage = 3
      const route = await router.route(
        amountIn,
        CurrentConfig.tokens.out,
        TradeType.EXACT_INPUT,
        {
          recipient: nexusClient.account.address,
          slippageTolerance: new Percent(Math.floor(slippagePercentage * 100), 10000),
          deadline: Math.floor(Date.now() / 1000 + 60*60), // 30 minutes from now
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
      console.log('Routes', route.route)
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
      const hash = await nexusClient.sendUserOperation({
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
      console.log('Transaction approve hash:::', hash)
      const approveUserOp = await nexusClient.waitForUserOperationReceipt({ hash, timeout: 1000 * 100, retryCount: 10 })
      console.log('Receipt:::', approveUserOp.receipt)

      // const {results} = await nexusClient.account.publicClient.simulateCalls({
      //   account: nexusClient.account,
      //   calls: [
      //     {
      //       to: SWAP_ROUTER_02_ADDRESSES(base.id) as Hex,
      //       data: route.methodParameters?.calldata as `0x${string}`,
      //       value: route.methodParameters?.value ? BigInt(route.methodParameters.value.toString()) : BigInt(0),
      //     }
      //   ]
      // })
      // console.log('Simulation results:::', results)
      // return;


      // TODO: attempt to install fallback module
      const installResult = await nexusClient.installModule({
        account: nexusClient.account,
        module: {
          address: '' as Address,
          type: 'fallback',
          initData: '' as Hex
        }
      })
      
      console.log('Swap router contracts', SWAP_ROUTER_02_ADDRESSES(base.id), route.methodParameters.to)
      console.log('Value in hex', BigInt(route.methodParameters.value), amount)
      const swapHash = await nexusClient.sendTransaction({
        calls: [
          {
            to: SWAP_ROUTER_02_ADDRESSES(base.id) as Hex,
            data: route.methodParameters?.calldata as `0x${string}`,
            value: route.methodParameters?.value ? BigInt(route.methodParameters.value.toString()) : BigInt(0),
          }
        ],
        maxFeePerGas: (await nexusClient.getGasFeeValues()).fast.maxFeePerGas,
        maxPriorityFeePerGas: (await nexusClient.getGasFeeValues()).fast.maxPriorityFeePerGas
      })
      console.log('Transaction swap hash:::', swapHash)
      const swapUserOP = await nexusClient.waitForUserOperationReceipt({ hash: swapHash, timeout: 1000 * 100, retryCount: 10 })
      console.log('Receipt:::', swapUserOP.receipt)
    } catch (error: any) {
      console.log(error, ":::error")
    }

  }, { timeout: 1000 * 1000000 })
})

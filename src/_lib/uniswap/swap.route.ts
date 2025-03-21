import { AlphaRouter, ID_TO_CHAIN_ID, SWAP_ROUTER_02_ADDRESSES, SwapType } from "@uniswap/smart-order-router"
import { base, baseSepolia } from "viem/chains"
import { SwapConfig } from "./swap.utils";
import { BigNumber } from "@ethersproject/bignumber";
import { erc20Abi, formatEther, Hex, parseUnits } from "viem";
import { ethers } from "ethers";
import { CurrencyAmount, Percent, Token, TradeType } from "@uniswap/sdk-core";
import { FeeAmount } from "@uniswap/v3-sdk";
import JSBI from "jsbi"
import { getNexusClient } from "../biconomy/client.mts";

export const getProvider = () => {
  const providerUrl = base.rpcUrls.default.http[0];
  return new ethers.providers.JsonRpcProvider(providerUrl)
}

export const router = new AlphaRouter({
  chainId: base.id,
  provider: getProvider()
})

const USDC_TOKEN = new Token(base.id, `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, 6, 'USDC')
const ETH_BASE = new Token(base.id, `0x4200000000000000000000000000000000000006`, base.nativeCurrency.decimals, 'ETH')

export type TokenSymbol = 'USDC' | 'ETH';
interface ISwapInput {
  tokenInSymbol: TokenSymbol;
  tokenOutSymbol: TokenSymbol;
  tokenInAmount: string;
  address: string;
  execute: boolean;
  userPK: Hex
}
export const getQuoteAndExecute = async ({
  tokenInSymbol,
  tokenOutSymbol,
  tokenInAmount,
  address,
  userPK,
  execute
}: ISwapInput) => {
  try {
    const token = {
      'USDC': USDC_TOKEN,
      'ETH': ETH_BASE
    }
    // constrcut swap config
    const SwapConfig = {
      tokens: {
        in: token[tokenInSymbol],
        out: token[tokenOutSymbol],
        amountIn: Number(tokenInAmount),
        poolFee: FeeAmount.MEDIUM
      },
      wallet: {
        address
      },
      rpc: {
        testnet: baseSepolia.rpcUrls.default.http[0],
        mainnet: base.rpcUrls.default.http[0]
      }
    } satisfies SwapConfig;
    const slippagePercent = 0.5
    const bigIntAmount = JSBI.toNumber(
      JSBI.BigInt(parseUnits(SwapConfig.tokens.amountIn.toString(), SwapConfig.tokens.in.decimals).toString())
    );
    const amountIn = CurrencyAmount.fromRawAmount(
      SwapConfig.tokens.in,
      bigIntAmount,
    )
    const route = await router.route(
      amountIn,
      SwapConfig.tokens.out,
      TradeType.EXACT_INPUT,
      {
        recipient: SwapConfig.wallet.address,
        slippageTolerance: new Percent(Math.floor(slippagePercent * 100), 10000),
        deadline: Math.floor(Date.now() / 1000 + 1800), // 30 minutes from now
        type: SwapType.SWAP_ROUTER_02
      }
    );

    if (!route || !route.methodParameters) {
      throw new Error('No route found');
    }
    const quote = route.quote.toFixed(SwapConfig.tokens.out.decimals);
    console.log(quote, "::quote")

    const swapRouterAddress = SWAP_ROUTER_02_ADDRESSES(base.id) as Hex;
    const amount = parseUnits(SwapConfig.tokens.amountIn.toString(), SwapConfig.tokens.in.decimals);
    console.log(swapRouterAddress, amount, ":::approve function input")

    const nexusClient = await getNexusClient(userPK, base.id, false, true)
    const approveGas = await nexusClient.estimateUserOperationGas({
      calls: [
        {
          abi: erc20Abi,
          functionName: 'approve',
          to: SwapConfig.tokens.in.address as Hex,
          args: [
            swapRouterAddress,
            amount
          ]
        }
      ],
      maxFeePerGas: BigInt(1000),
      maxPriorityFeePerGas: BigInt(10000)
    })
    const execGas = await nexusClient.estimateUserOperationGas({
      calls: [{
        to: SWAP_ROUTER_02_ADDRESSES(baseSepolia.id) as Hex,
        data: route.methodParameters?.calldata as `0x${string}`,
        value: route.methodParameters?.value ? BigInt(route.methodParameters.value.toString()) : BigInt(0),
      }],
      maxFeePerGas: BigInt(1000),
      maxPriorityFeePerGas: BigInt(10000)
    })
    console.log('Gas:::', execGas)

    if (!execute) {
      return { quote, gasFee: formatEther(approveGas.callGasLimit + execGas.callGasLimit, 'wei') };
    }

    const hash = await nexusClient.sendUserOperation({
      calls: [
        {
          abi: erc20Abi,
          functionName: 'approve',
          to: SwapConfig.tokens.in.address as Hex,
          args: [
            swapRouterAddress,
            amount
          ]
        }
      ],
      maxFeePerGas: BigInt(1000),
      maxPriorityFeePerGas: BigInt(10000)
    })
    const receipt = await nexusClient.waitForTransactionReceipt({ hash })
    console.log('Approve Receipt:::', receipt)


    // Send the transaction using viem
    const swapHash = await nexusClient.sendTransaction({
      calls: [{
        to: SWAP_ROUTER_02_ADDRESSES(baseSepolia.id) as Hex,
        data: route.methodParameters?.calldata as `0x${string}`,
        value: route.methodParameters?.value ? BigInt(route.methodParameters.value.toString()) : BigInt(0),
      }],
      maxFeePerGas: BigInt(1000),
      maxPriorityFeePerGas: BigInt(10000)
    });

    // Wait for the transaction to be mined
    const swapreceipt = await nexusClient.waitForTransactionReceipt({ hash: swapHash });
    console.log('SwapReceipt', swapreceipt)
  }
  catch (error: any) {
    console.log('Errror Executing:::', error)
    throw error;
  }
}

import { base, baseSepolia } from "viem/chains"
import { Token, CurrencyAmount, TradeType, V3_CORE_FACTORY_ADDRESSES, BigintIsh } from "@uniswap/sdk-core"
import { FeeAmount, computePoolAddress, Route, Pool, SwapRouter, SwapQuoter } from "@uniswap/v3-sdk"
import { Address, createPublicClient, getContract, Hex, http, parseUnits, decodeAbiParameters, erc20Abi } from "viem"
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json"
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json"
import JSBI from "jsbi"

export const getPublicClient = () => {
  return createPublicClient({
    chain: base,
    transport: http()
  })
}

export interface SwapConfig {
  rpc: {
    testnet: string;
    mainnet: string;
  };
  wallet?: {
    address?: string;
    privateKey?: string;
  };
  tokens: {
    in: Token;
    amountIn: number;
    out: Token;
    poolFee: number;
  }
}

const UDST_TOKEN = `0x323e78f944A9a1FcF3a10efcC5319DBb0bB6e673`;
const USDC_TOKEN_SEP = new Token(baseSepolia.id, `0x036CbD53842c5426634e7929541eC2318f3dCF7e`, 6);
const USDC_TOKEN = new Token(base.id, `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, 6, 'USDC')
const USDT_TOKEN2 = new Token(baseSepolia.id, `0xd7e9C75C6C05FdE929cAc19bb887892de78819B7`, 18);
const ETH_BASE_SEP = new Token(baseSepolia.id, `0x4200000000000000000000000000000000000006`, baseSepolia.nativeCurrency.decimals);
const ETH_BASE = new Token(base.id, `0x4200000000000000000000000000000000000006`, base.nativeCurrency.decimals, 'ETH')

// Quoter address
export const BASE_QUOTER_ADDRESS = `0xC5290058841028F1614F3A6F0F5816cAd0df5E27`;

export const CurrentConfig = {
  rpc: {
    testnet: `https://base-sepolia-rpc.publicnode.com`,
    mainnet: `https://base-rpc.publicnode.com`
  },
  wallet: {
    address: '0x35B1D3d3aC5bF1a0C5cd22F47eCc61C616D0fdAA',
    privateKey: `0x5975c9645ba8cfd89800db0ec057211f142fcad8c36366de99b5495aee9df2c8`
  },
  tokens: {
    in: ETH_BASE,
    amountIn: 1,
    out: USDC_TOKEN,
    poolFee: FeeAmount.MEDIUM
  }
} satisfies SwapConfig

export const POOL_FACTORY_CONTRACT_ADDRESS = `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24`;

export const currentPoolAddress = computePoolAddress({
  factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
  tokenA: CurrentConfig.tokens.in,
  tokenB: CurrentConfig.tokens.out,
  fee: CurrentConfig.tokens.poolFee,
})

export const publicClient = getPublicClient()

// pool contract
export const poolContract = getContract({
  address: currentPoolAddress as Address,
  abi: IUniswapV3PoolABI.abi,
  client: publicClient
})

// quoter contract
export const quoterContract = getContract({
  address: BASE_QUOTER_ADDRESS,
  abi: Quoter.abi,
  client: publicClient
})


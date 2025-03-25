import QRCode from "qrcode";
import { tryCatch } from "./try-catch";
import {
  base,
  baseSepolia,
  mainnet,
  sepolia,
  polygon,
  polygonAmoy,
  arbitrum,
  arbitrumSepolia,
  bsc,
  bscTestnet
} from "viem/chains"
import { extractChain } from "viem";

export const generateQR = async (value: string) => {
  const { data: dataUrl, error } = await tryCatch(
    QRCode.toDataURL(value),
    { action: 'generate-qrcode' }
  );

  if (error) throw new Error('Failed to generate QR Code');
  return dataUrl;
}

export const defaultChainIds = [
  base.id,
  baseSepolia.id, // 84532
  mainnet.id,
  sepolia.id,
  polygon.id,
  polygonAmoy.id,
  arbitrum.id,
  arbitrumSepolia.id,
  bsc.id,
  bscTestnet.id
]

export const chainLogos: Record<number, string> = {
  [sepolia.id]: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  [mainnet.id]: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  [bsc.id]: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
  [bscTestnet.id]: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
  [polygon.id]: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
  [polygonAmoy.id]: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
  [arbitrum.id]: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
  [arbitrumSepolia.id]: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
  [base.id]: 'https://s2.coinmarketcap.com/static/img/coins/64x64/27716.png',
  [baseSepolia.id]: 'https://s2.coinmarketcap.com/static/img/coins/64x64/27716.png'
}

// maybe add default USDc and USDt addresses to the default network
export interface WalletToken {
  address?: string;
  decimals: number;
  name: string;
  symbol: string;
  chain: number | string;
  isTracked: boolean;
  isNative: boolean;
}
export const defaultNativeTokens: WalletToken[] = defaultChainIds.map((id) => {
  const chain = extractChain({
    chains: [
      base,
      baseSepolia,
      mainnet,
      sepolia,
      polygon,
      polygonAmoy,
      arbitrum,
      arbitrumSepolia,
      bsc,
      bscTestnet
    ], id: id as any
  })
  return {
    ...chain.nativeCurrency,
    chain: id,
    isNative: true,
    isTracked: true,
  }
})
export const defaultUSDTTokens = [
  {
    address: '0x323e78f944A9a1FcF3a10efcC5319DBb0bB6e673',
    decimals: 6,
    name: 'Tether USD',
    symbol: 'USDT',
    chain: baseSepolia.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    decimals: 6,
    name: 'Tether USD',
    symbol: 'USDT',
    chain: base.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    decimals: 6,
    name: 'Tether USD',
    symbol: 'USDT',
    chain: sepolia.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    name: 'Tether USD',
    symbol: 'USDT',
    chain: mainnet.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0x3109953bc0db7bbcbe4e3b000886d9b2a52c2877',
    decimals: 6,
    name: 'Tether USD',
    symbol: 'USDT',
    chain: polygonAmoy.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    decimals: 6,
    name: 'Tether USD',
    symbol: 'USDT',
    chain: polygon.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0x30fA2FbE15c1EaDfbEF28C188b7B8dbd3c1Ff2eB',
    decimals: 6,
    name: 'Tether USD',
    symbol: 'USDT',
    chain: arbitrumSepolia.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    decimals: 6,
    name: 'Tether USD',
    symbol: 'USDT',
    chain: arbitrum.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0x221c5B1a293aAc1187ED3a7D7d2d9aD7fE1F3FB0',
    decimals: 18,
    name: 'Tether USD',
    symbol: 'USDT',
    chain: bscTestnet.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0x55d398326f99059ff775485246999027b3197955',
    decimals: 18,
    name: 'Tether UDS',
    symbol: 'USDT',
    chain: bsc.id,
    isTracked: true,
    isNative: false
  }
] satisfies WalletToken[]
export const defaultUSDCTokens = [
  {
    address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    chain: baseSepolia.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    chain: base.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    chain: sepolia.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    chain: mainnet.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582',
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    chain: polygonAmoy.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    chain: polygon.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    chain: arbitrumSepolia.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    chain: arbitrum.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0x64544969ed7EBf5f083679233325356EbE738930',
    decimals: 18,
    name: 'USD Coin',
    symbol: 'USDC',
    chain: bscTestnet.id,
    isTracked: true,
    isNative: false
  },
  {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    decimals: 18,
    name: 'Circlce USD',
    symbol: 'USDC',
    chain: bsc.id,
    isTracked: true,
    isNative: false
  }
] satisfies WalletToken[];

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
import { Address, extractChain } from "viem";
import redis from "./cache/redis";
import cron from "node-cron"

export const generateQR = async (value: string) => {
  const { data: dataUrl, error } = await tryCatch(
    QRCode.toDataURL(value),
    { action: 'generate-qrcode' }
  );

  if (error) throw new Error('Failed to generate QR Code');
  return dataUrl;
}

export const explorerUrls = {
  [bscTestnet.id]: `${bscTestnet.blockExplorers.default.url}/tx`,
  [bsc.id]: `${bsc.blockExplorers.default.url}/tx`,
  [base.id]: `${base.blockExplorers.default.url}/tx`,
  [baseSepolia.id]: `${baseSepolia.blockExplorers.default.url}/tx`,
  [polygon.id]: `${polygon.blockExplorers.default.url}/tx`,
  [polygonAmoy.id]: `${polygonAmoy.blockExplorers.default.url}/tx`,
  [mainnet.id]: `${mainnet.blockExplorers.default.url}/tx`,
  [sepolia.id]: `${sepolia.blockExplorers.default.url}/tx`,
  [arbitrum.id]: `${arbitrum.blockExplorers.default.url}/tx`,
  [arbitrumSepolia.id]: `${arbitrumSepolia.blockExplorers.default.url}/tx`
};

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


export const getCoingeckoTokenIdList = async () => {
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/list`, {
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    return await response.json() as { id: string; symbol: string; name: string }[];
  }
  console.log('Error', response.status, response.statusText)
  throw new Error(response.statusText ?? 'Failed to fetch id list')
}

export const getCoingeckoTokenInfo = async (cgId?: string, invalidate: boolean = false) => {
  if (!cgId) return null
  if (!invalidate) {
    console.log('Cache hit invalidate', invalidate)
    const cacheInfo = await redis.get(`${cgId}:info`);
    if (cacheInfo) {
      console.log('Cache hit')
      return cacheInfo as {
        description: { en: string };
        links: Record<string, any>;
        image: Record<'thumb' | 'small' | 'large', string>;
        market_cap_rank: number;
        market_data: any
      }
    }
  }
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/${cgId}?market_data=true&developer_data=false&community_data=false&tickers=true`, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (response.ok) {
    const data = await response.json() as {
      description: { en: string };
      links: Record<string, any>;
      image: Record<'thumb' | 'small' | 'large', string>;
      market_cap_rank: number;
      contract_address: string;
      market_data: any
    }
    await redis.set(`${cgId}:info`, JSON.stringify(data), { ex: 12 * 60 * 60 })
    await new Promise((resolve) => setTimeout(resolve, 8000))
    return data;
  }
  console.log('Error', response.status, response.statusText)
  throw new Error(response.statusText ?? 'Failed to fetch id list')
}
export const getCoingeckoTokenPrice = async (cgId?: string) => {
  if (!cgId) return null
  const cacheInfo = await redis.get(`${cgId}:price`);
  if (cacheInfo) {
    return cacheInfo
  }

  const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${cgId}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (response.ok) {
    const data = await response.json()
    await redis.set(`${cgId}:price`, JSON.stringify(data), { ex: 3 * 60 * 60 })
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return data;
  }
  console.log('Error', response.status, response.statusText)
  throw new Error(response.statusText ?? 'Failed to fetch id list')
}

export const getCoingeckoMarketData = async (cgIds: string[]) => {
  const cacheInfo = await redis.get(`market-data`);
  if (cacheInfo) {
    return cacheInfo
  }

  const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cgIds.join(',')}&order=market_cap_desc`, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (response.ok) {
    const data = await response.json()
    await redis.set(`market-data`, JSON.stringify(data), { ex: 8 * 60 * 60 })
    return data;
  }
  console.log('Error', response.status, response.statusText)
  throw new Error(response.statusText ?? 'Failed to fetch id list')
}

export const getTokenIdByAddress = async (platformId: string, tokenAddress: Address) => {
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/${platformId}/contract/${tokenAddress}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (response.ok) {
    const data = await response.json() as { id: string }
    return data.id // GC token id
  }

  console.log('Error: token info with address', response.status, response.statusText)
  throw new Error(response.statusText ?? 'Failed to fetch id list')
}

export const getPlatformId = async (chainId: number) => {
  const response = await fetch(`https://api.coingecko.com/api/v3/asset_platforms`, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (response.ok) {
    const data = await response.json() as { id: string; chain_identifier: number }[]
    const platform_id = data.find((d) => d.chain_identifier === chainId)?.id;
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return platform_id // GC platform id
  }

  console.log('Error: token info with address', response.status, response.statusText)
  throw new Error(response.statusText ?? 'Failed to fetch id list')
}

// export const cgIds = [
//   'binancecoin',
//   'matic-network',
//   'ethereum',
//   'l2-standard-bridged-weth-base',
//   'usd-coin',
//   'tether'
// ]
export const scheduleInfoFetch = () => {
  cron.schedule('*/30 * * * *', async () => {
		console.log('running a task every minute 1-5');
    const { getTokenCgIds } = await import("../db/index");
    const cgIds = await getTokenCgIds();
    for (const id of cgIds) {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?market_data=true&developer_data=false&community_data=false&tickers=true`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json() as {
          description: { en: string };
          links: Record<string, any>;
          image: Record<'thumb' | 'small' | 'large', string>;
          market_cap_rank: number;
          contract_address: string;
          market_data: any
        }
        await redis.set(`${id}:info`, JSON.stringify(data), { ex: 8 * 60 * 60 })
        console.log('fetched data', response.status)
        await new Promise((resolve) => setTimeout(resolve, 10000))
        continue;
      }
      console.log('Error', response.status, response.statusText)
    }
  });
}

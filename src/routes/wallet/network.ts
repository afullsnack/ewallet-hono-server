import appFactory from "../../app"
import * as chains from "viem/chains"
import { defaultChainIds } from "src/_lib/utils";

const networkRoute = appFactory.createApp()

interface Network {
  name: string;
  id: number;
  nativeCurrency: {
    decimals: 18;
    name: string;
    symbol: string
  }
}

networkRoute.get('/', async (c) => {
  const networks = Object.values(chains)
  const parsedNetwork: Network[] = defaultChainIds.map((id) => ({
    name: networks.find((n) => n.id === id)?.name!,
    id: id,
    nativeCurrency:networks.find((n) => n.id === id)?.nativeCurrency as any,
  }))
  
  return c.json({
    success: true,
    message: 'Network list',
    networks: parsedNetwork
  })
})



export { networkRoute }

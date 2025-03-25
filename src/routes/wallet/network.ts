import appFactory from "../../app"
import * as chains from "viem/chains"
import { chainLogos, defaultChainIds } from "src/_lib/utils";
import { HTTPException } from "hono/http-exception";
import { getUserWithWallets } from "src/db";
import { extractChain } from "viem";

const networkRoute = appFactory.createApp()

interface Network {
  name: string;
  id: number;
  logo: string;
}

networkRoute.get('/', async (c) => {
  const user = c.get('user')
  if (!user) throw new HTTPException(404, { message: 'User not found' })

  const userWallet = await getUserWithWallets(user.id)
  if (!userWallet) throw new HTTPException(404, { message: 'User wallet not found' })

  const networks = Object.values(chains)
  const parsedNetwork: Network[] = userWallet.wallets.map((w) => {
    const chain = extractChain({ chains: networks, id: Number(w.chainId) as any })

    return {
      name: chain.name,
      id: chain.id,
      logo: w.chainLogo ?? ''
    }
  })

  return c.json({
    success: true,
    message: 'Network list',
    networks: parsedNetwork
  })
})



export { networkRoute }

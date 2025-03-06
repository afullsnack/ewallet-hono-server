
import { privateKeyToAccount } from "viem/accounts";
import * as chains from "viem/chains";
import { Address, Hex, http, zeroAddress, extractChain } from "viem";
import {
  // createMeeClient,
  createSmartAccountClient,
  // mcUSDC,
  // toMultichainNexusAccount,
  toNexusAccount,
  createBicoPaymasterClient,
} from "@biconomy/abstractjs";


const paymasterUrl = (chainId: number = 84532) =>  `https://paymaster.biconomy.io/api/v1/${chainId}/0SDld9I3l.a51bbf9c-0700-4385-b434-f4ca64a289fa`;
const bundlerUrl = (chainId: number = 84532) => `https://bundler.biconomy.io/api/v3/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`


// return biconomy nexus client with or without paymaster
export const getNexusClient = async (privateKey: Hex, chainId: number, withPM: boolean = false) => {
    const account = privateKeyToAccount(privateKey)
    const nexusClient = createSmartAccountClient({
        account: await toNexusAccount({
            signer: account,
            chain: extractChain({chains: Object.values(chains) as chains.Chain[], id: chainId}),
            transport: http(),
        }),
        transport: http(bundlerUrl(chainId)),
        paymaster: withPM? createBicoPaymasterClient({paymasterUrl: paymasterUrl(chainId)}) : undefined,
    });

    const address = nexusClient.account?.address!;
    console.log("smart accounts address", address)
    return nexusClient;
    // try {
    //     const hash = await nexusClient.sendTransaction({
    //         calls: [{to : '0xf5715961C550FC497832063a98eA34673ad7C816', value: 0n}],
    //         paymaster: createBicoPaymasterClient({paymasterUrl: paymasterUrl(chainId)}),
    //     });
    //     console.log("Transaction hash: ", hash);
    //     const receipt = await nexusClient.waitForTransactionReceipt({ hash });
    //     console.log("Transaction receipt: ", receipt);
    //     return {address , hash};
    // }
    // catch (error) {
    //     console.log(error, ":::error minx");
    //     return {address}
    // }
}

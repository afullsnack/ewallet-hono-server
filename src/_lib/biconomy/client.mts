
import { privateKeyToAccount } from "viem/accounts";
import * as chains from "viem/chains";
import { Address, Hex, http, zeroAddress, extractChain } from "viem";
import {
  // createMeeClient,
  createSmartAccountClient,
  // mcUSDC,
  // toMultichainNexusAccount,
  toNexusAccount
} from "@biconomy/abstractjs";


const newPrivateKey = `0x432afee423c3f7b52569b3f73e656d6700acaf66594f0935a2e0829ceac1434f`;
// const bundlerUrl = "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44";
const newBundlerUrl = "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"

export const getNexusClient = async (privateKey: Hex, chainId: number) => {
    const account = privateKeyToAccount(privateKey)
    const nexusClient = createSmartAccountClient({
        account: await toNexusAccount({
            signer: account,
            chain: extractChain({chains: Object.values(chains) as chains.Chain[], id: chainId}),
            transport: http(),
        }),
        transport: http(newBundlerUrl),
    });

    const address = nexusClient.account?.address!;
    console.log("smart accounts address", address)
    return nexusClient;
    // try {
    //     const hash = await nexusClient.sendTransaction({ calls: [{to : '0xf5715961C550FC497832063a98eA34673ad7C816', value: 0n}] });
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

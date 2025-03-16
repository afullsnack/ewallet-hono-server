
import { privateKeyToAccount } from "viem/accounts";
import * as chains from "viem/chains";
import { Address, Hex, http, zeroAddress, extractChain, createPublicClient, formatEther } from "viem";
import {
  // createMeeClient,
  createSmartAccountClient,
  // mcUSDC,
  // toMultichainNexusAccount,
  toNexusAccount,
  createBicoPaymasterClient,
  NexusClient,
} from "@biconomy/abstractjs";


const paymasterUrl = (chainId: number = 84532) =>  `https://paymaster.biconomy.io/api/v1/${chainId}/0SDld9I3l.a51bbf9c-0700-4385-b434-f4ca64a289fa`;
const bundlerUrl = (chainId: number = 84532) => `https://bundler.biconomy.io/api/v3/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`


// return biconomy nexus client with or without paymaster
export const getNexusClient = async (privateKey: Hex, chainId: number = 84532, withPM: boolean = false) => {
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
}

export const getTransactionEstimate = async (nexusClient: NexusClient, chainId: number = 84532, receiver: Address, amount: bigint) => {
    try {
        const info = await nexusClient.estimateUserOperationGas({
            calls: [{to : receiver, value: amount}],
            paymaster: createBicoPaymasterClient({paymasterUrl: paymasterUrl(chainId)}),
        });
        console.log("Transaction info: ", info);
        // const receipt = await nexusClient.waitForTransactionReceipt({ hash });
        // console.log("Transaction receipt: ", receipt);
        return {receiver , info};
    }
    catch (error) {
        console.log(error, ":::error minx");
        return {receiver}
    }
}

export const sendTransaction = async (nexusClient: NexusClient, chainId: number = 84532, receiver: Address, amount: bigint) => {
    try {
        const hash = await nexusClient.sendTransaction({
            calls: [{to : receiver, value: amount}],
            paymaster: createBicoPaymasterClient({paymasterUrl: paymasterUrl(chainId)}),
        });
        console.log("Transaction hash: ", hash);
        const receipt = await nexusClient.waitForTransactionReceipt({ hash });
        console.log("Transaction receipt: ", receipt);
        return {receiver , hash};
    }
    catch (error) {
        console.log(error, ":::error minx");
        return {receiver}
    }
}

export const getBalance = async (chainId: number = 84532, address: Address) => {
    const publicClient = createPublicClient({
        chain: extractChain({chains: Object.values(chains) as chains.Chain[], id: chainId}),
        transport: http()
    })

    const balance = await publicClient.getBalance({address})
    console.log(balance, ":::balance of account")
    return Number(formatEther(balance, 'wei'));
}

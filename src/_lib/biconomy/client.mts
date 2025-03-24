
import { privateKeyToAccount } from "viem/accounts";
import * as chains from "viem/chains";
import { Address, Hex, http, zeroAddress, extractChain, createPublicClient, formatEther, erc20Abi } from "viem";
import {
  // createMeeClient,
  createSmartAccountClient,
  // mcUSDC,
  // toMultichainNexusAccount,
  toNexusAccount,
  createBicoPaymasterClient,
  NexusClient,
} from "@biconomy/abstractjs";


const baseSepoliaPaymasterUrl = `https://paymaster.biconomy.io/api/v2/84532/HJ4A-yoIU.590fc68b-f046-42db-b7b5-9279e73849d4`;
const baseMainnetPaymasterUrl = `https://paymaster.biconomy.io/api/v2/8453/7eH0H99xI.d370d528-6c6e-4089-b646-8947dc387657`
const bundlerUrl = (chainId: number = 84532) => `https://bundler.biconomy.io/api/v3/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`
const bundlerUrlMainnet = (chainId: number) => `https://bundler.biconomy.io/api/v3/${chainId}/0107498c-14fb-4739-b607-c913343474b1`


// return biconomy nexus client with or without paymaster
export const getNexusClient = async (privateKey: Hex, chainId: number = 84532, withPM: boolean = false, isMainnet: boolean = false) => {
    const account = privateKeyToAccount(privateKey)
    const nexusClient = createSmartAccountClient({
        account: await toNexusAccount({
            signer: account,
            chain: extractChain({chains: Object.values(chains) as chains.Chain[], id: chainId}),
            transport: http(),
        }),
        transport: http(isMainnet? bundlerUrlMainnet(chainId) : bundlerUrl(chainId)),
        paymaster: withPM? createBicoPaymasterClient({paymasterUrl: isMainnet? baseMainnetPaymasterUrl : baseSepoliaPaymasterUrl}) : undefined,
    });

    const address = nexusClient.account?.address!;
    console.log("smart accounts address", address)
    return nexusClient;
}

export const getTransactionEstimate = async (nexusClient: NexusClient, receiver: Address, amount: bigint) => {
    try {
        const prep = await nexusClient.prepareUserOperation({
            calls: [{to : receiver, value: amount}],
            // paymaster: createBicoPaymasterClient({paymasterUrl: paymasterUrl(chainId)}),
        })
        console.log(prep, ":::prepped transaction")
        // const info = await nexusClient.estimateUserOperationGas({
        //     calls: [{to: receiver, value: amount}],
        // });
        return {receiver , info: prep};
    }
    catch (error) {
        console.log(error, ":::error getting estimate");
        throw error;
    }
}

export const sendTransaction = async (nexusClient: NexusClient, receiver: Address, amount: bigint) => {
    try {
        const hash = await nexusClient.sendTransaction({
            calls: [{to: receiver, value: amount}],
            // paymaster: createBicoPaymasterClient({paymasterUrl: paymasterUrl(chainId)}),
        });
        console.log("Transaction hash: ", hash);
        const receipt = await nexusClient.waitForTransactionReceipt({ hash });
        console.log("Transaction receipt: ", receipt);
        return {receiver , hash, receipt};
    }
    catch (error) {
        console.log(error, ":::error minx");
        throw error;
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

export const getNonNativeBalance = async (chainId: number, tokenAddress: Address, walletAddress: Address) => {
    const publicClient = createPublicClient({
        chain:extractChain({chains: Object.values(chains) as chains.Chain[], id: chainId}),
        transport: http()
    })
    const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [walletAddress]
    })
    console.log('Balance:::', balance)
    return Number(formatEther(balance, 'wei'))
}

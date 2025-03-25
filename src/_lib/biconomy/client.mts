
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

const ankrRPCUrls = {
    56: `https://rpc.ankr.com/bsc/8ac326f9677554da21ffdbd8ce72ba4a194ed539e827759440ba90c2075c7770`,
    97: `https://rpc.ankr.com/bsc_testnet_chapel/8ac326f9677554da21ffdbd8ce72ba4a194ed539e827759440ba90c2075c7770`
}

// return biconomy nexus client with or without paymaster
export const getNexusClient = async (privateKey: Hex, chainId: number = 84532, withPM: boolean = false) => {
    const account = privateKeyToAccount(privateKey)
    const chain = extractChain({chains: Object.values(chains) as chains.Chain[], id: chainId})
    const isMainnet = !!chain.testnet
    const nexusClient = createSmartAccountClient({
        account: await toNexusAccount({
            signer: account,
            chain,
            transport: http((chainId === 56 || chainId === 97)? ankrRPCUrls[chainId] : undefined),
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

export const sendTransaction = async (nexusClient: NexusClient, receiver: Address, amount: bigint, isNative: boolean = true, tokenAddress?: Address) => {
    try {
        if(isNative) {
            const hash = await nexusClient.sendTransaction({
                calls: [{to: receiver, value: amount}],
                // paymaster: createBicoPaymasterClient({paymasterUrl: paymasterUrl(chainId)}),
            });
            console.log("Transaction hash: ", hash);
            const receipt = await nexusClient.waitForTransactionReceipt({ hash });
            console.log("Transaction receipt: ", receipt);
            return {receiver , hash, receipt};
        } else {
            const {request} = await nexusClient.account.publicClient.simulateContract({
                address: tokenAddress!,
                abi: erc20Abi,
                functionName: 'transfer',
                args: [receiver, amount]
            })
            const hash = await nexusClient.account.walletClient.writeContract(request as any)
            console.log("Transaction hash: ", hash);
            const receipt = await nexusClient.waitForTransactionReceipt({ hash });
            console.log("Transaction receipt: ", receipt);
            return {receiver , hash, receipt};
        }
    }
    catch (error) {
        console.log(error, ":::error minx");
        throw error;
    }
}

export const getBalance = async (nexusClient: NexusClient, address: Address) => {
    // const chain = extractChain({chains: Object.values(chains) as chains.Chain[], id: chainId})
    // console.log('RPC', chain.rpcUrls.default.http[0])
    
    // const publicClient = createPublicClient({
    //     chain,
    //     transport: http(chain.rpcUrls.default.http[0])
    // })

    const balance = await nexusClient.account.publicClient.getBalance({address})
    return Number(formatEther(balance, 'wei'));
}

export const getNonNativeBalance = async (nexusClient: NexusClient, tokenAddress: Address, walletAddress: Address) => {
    // const chain = extractChain({chains: Object.values(chains) as chains.Chain[], id: chainId});
    // const publicClient = createPublicClient({
    //     chain,
    //     transport: http(chain.rpcUrls.default.http[0])
    // })
    const balance = await nexusClient.account.publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [walletAddress]
    })
    return Number(formatEther(balance, 'wei'))
}

export const getTokenData = async (nexusClient: NexusClient, tokenAddress: Address) => {
    const [symbol, name, decimals] = await Promise.all([
        nexusClient.account.publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'symbol',
        }),
        nexusClient.account.publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'name',
        }),
        nexusClient.account.publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'decimals',
        }),
    ])

    return {symbol, name, decimals}
}

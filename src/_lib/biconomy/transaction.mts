import {
  createSmartAccountClient,
  createBicoPaymasterClient,
  toNexusAccount,
} from "@biconomy/abstractjs";
import { http, parseEther } from "viem";
import { Address, privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const bundlerUrl = ``;
const paymasterUrl = ``;

interface ITransaction {
  privateKey: string;
}
export async function handleNexuTransaction(params: ITransaction) {
  const eoaAccount = privateKeyToAccount(params.privateKey as Address);

  const nexusClient = createSmartAccountClient({
    account: await toNexusAccount({
      signer: eoaAccount,
      chain: baseSepolia,
      transport: http(),
    }),
    transport: http(bundlerUrl),
    paymaster: createBicoPaymasterClient(paymasterUrl),
  });
}

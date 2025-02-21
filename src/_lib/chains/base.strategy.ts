import { HDAccount } from "../helpers/wallet";

export interface AccountCreationInput {
  mnemonic?: string;
  password?: string; // change to required
}
export interface AccountCreationResult {mnemonic: string; accounts: HDAccount[]};
export interface IBaseChainStrategy {
  createAccount: (params: AccountCreationInput) => Promise<AccountCreationResult>;
  send: () => Promise<void>;
  receive: () => Promise<string>;
}

export abstract class BaseChainStrategy implements IBaseChainStrategy {
  abstract createAccount(params: AccountCreationInput): Promise<AccountCreationResult>;
  abstract send(): Promise<void>;
  abstract receive(): Promise<string>;
}

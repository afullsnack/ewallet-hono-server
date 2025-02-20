import { HDAccount } from "../helpers/wallet";

export interface AccountCreationResult {mnemonic: string; accounts: HDAccount[]};
interface IBaseChainStrategy {
  createAccount: (path: string) => Promise<AccountCreationResult>;
  send: () => Promise<void>;
  receive: () => Promise<string>;
}

export abstract class BaseChainStrategy implements IBaseChainStrategy {
  abstract createAccount(path: string): Promise<AccountCreationResult>;
  abstract send(): Promise<void>;
  abstract receive(): Promise<string>;
}

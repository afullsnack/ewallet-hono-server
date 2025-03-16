import { HDAccount } from "../helpers/wallet";

export interface AccountCreationInput {
  userId: string;
  mnemonic?: string;
  password?: string; // change to required
}
export interface AccountCreationResult {address: string};
export interface AccountRecoveryResult {
  encryptedPrivateKey: string;
  privateKey: string;
  address: string;
}

export interface AccountRecoveryInput {
  backupShare: string;
  password: string;
  walletId: string;
  mnemonic: string;
};
export interface IBaseChainStrategy {
  createAccount: (params: AccountCreationInput) => Promise<AccountCreationResult & {accountId: string}>;
  recoverAccount: (params: AccountRecoveryInput) => Promise<AccountRecoveryResult>;
  send: () => Promise<void>;
  receive: () => Promise<string>;
}

export abstract class BaseChainStrategy implements IBaseChainStrategy {
  abstract createAccount(params: AccountCreationInput): Promise<AccountCreationResult & {accountId: string}>;
  abstract recoverAccount(params: AccountRecoveryInput): Promise<AccountRecoveryResult>;
  abstract send(): Promise<void>;
  abstract receive(): Promise<string>;
}

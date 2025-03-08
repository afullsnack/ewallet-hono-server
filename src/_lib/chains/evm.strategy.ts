import { AccountCreationInput, AccountCreationResult, AccountRecoveryInput, AccountRecoveryResult, BaseChainStrategy } from "./base.strategy";
import { createHDAccounts } from "../helpers/wallet";
import bip39 from "bip39";
import { CryptoUtil } from "../helpers/hasher";
import { KeyManager } from "../key-manager/key-manager.service";
import { addWalletToUser, getWalletWithUser } from "../../db";
import { privateKeyToAddress } from "viem/accounts";
import { Hex } from "viem";
import {getNexusClient} from "../biconomy/client.mts";

export class EVMChainStrategy extends BaseChainStrategy {

  private PATH = `m/44'/60'/0'/0/0` // use evm path
  private networkSlug = 'evm';

  // remove parameter requirements if no use
  async createAccount(params: AccountCreationInput): Promise<AccountCreationResult & {accountId: string}> {
    const { mnemonic, accounts } = await createHDAccounts({
      mnemonic: params.mnemonic ?? bip39.generateMnemonic(),
      numberOfAccounts: 1,
      startIndex: 0,
      basePath: this.PATH
    });
    const walletPK = accounts[0]!.privateKey;

    const nClient = await getNexusClient(walletPK);
    const smartAddress = nClient.account.address;

    // update isBackedUp
    let encryptedPk: string;
    let hashedPassword: string;
    if (params.password) {
      // encryptedPk = CryptoUtil.encrypt(accounts[0]!.privateKey, params.password);
      const encryptedMnemonic = CryptoUtil.encrypt(mnemonic, params.password);
      hashedPassword = CryptoUtil.hash(params.password);
      const shares = new KeyManager().getShares(Buffer.from(walletPK));
      const result = await addWalletToUser({
        userId: params.userId,
        mnemonic: encryptedMnemonic, // enecrypt with password as well
        network: this.networkSlug as any,
        address: smartAddress,
        shareA: shares[0],
        shareB: shares[1],
        shareC: shares[2],
        recoveryPassword: hashedPassword,
      });
      return {
        accountId: result!.id,
        address: smartAddress
      }
    }
    // split unsecure acccount
    const shares = new KeyManager().getShares(Buffer.from(accounts[0]!.privateKey));
    const result = await addWalletToUser({
      userId: params.userId,
      mnemonic, // enecrypt with password as well
      network: this.networkSlug as any,
      address: smartAddress,
      shareA: shares[0],
      shareB: shares[1],
      shareC: shares[2],
    });

    return {
      accountId: result!.id,
      address: smartAddress
    }
  }


  async recoverAccount(params: AccountRecoveryInput): Promise<AccountRecoveryResult & {address: string}> {
    const account = await getWalletWithUser(params.walletId);
    if(!account) throw new Error('Wallet not found');
    if(!account.recoveryPassword) {
      throw new Error('Password has not been set, wallet has not been created');
    }
    const isValidPassword = CryptoUtil.verify(account.recoveryPassword, params.password);

    if(isValidPassword) {
      const encryptedPK = new KeyManager().recoverSecret([params.backupShare, account.shareA!])

      const privateKey = CryptoUtil.decrypt(encryptedPK.toString(), params.password);
      return {
        encryptedPrivateKey: encryptedPK.toString(),
        privateKey,
        address: privateKeyToAddress(privateKey as Hex),
      }
    }

    throw new Error('Password is not valid');
  }

  // send logic for EVM chains, implement with viem
  async send(): Promise<void> {
    throw new Error('Not implemented');
  }

  // get address to receive from db
  async receive(): Promise<string> {
    throw new Error('Not implemented');
  }

}

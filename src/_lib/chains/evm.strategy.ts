import { AccountCreationInput, AccountCreationResult, BaseChainStrategy } from "./base.strategy";
import { createHDAccounts } from "../helpers/wallet";
import bip39 from "bip39";
import { CryptoUtil } from "../helpers/hasher";
import { KeyManager, IKeyManagerService } from "../key-manager/key-manager.service";
import { addWalletToUser } from "src/db";

export class EVMChainStrategy extends BaseChainStrategy {

  private PATH = `m/44'/60'/0'/0/0` // use evm path
  private networkSlug = 'evm';

  // remove parameter requirements if no use
  async createAccount(params: AccountCreationInput): Promise<AccountCreationResult> {
    const { mnemonic, accounts } = await createHDAccounts({
      mnemonic: params.mnemonic ?? bip39.generateMnemonic(),
      numberOfAccounts: 1,
      startIndex: 0,
      basePath: this.PATH
    });

    // encrypt privateKey with password
    // hash password
    // split encrypted privatKey
    // store shares, hashed password, mnemonic(as plaintext)
    // update isBackedUp
    let encryptedPk: string;
    let hashedPassword: string;
    if (params.password) {
      encryptedPk = CryptoUtil.encrypt(accounts[0].privateKey, params.password);
      hashedPassword = CryptoUtil.hash(params.password);
      const shares = new KeyManager().getShares(Buffer.from(encryptedPk));
      await addWalletToUser({
        userId: 'user-id',
        mnemonic, // enecrypt with password as well
        network: this.networkSlug as any,
        address: accounts[0].address,
        shareA: shares[0],
        shareB: shares[1],
        shareC: shares[2],
        recoveryPassword: hashedPassword,
        isBackedUp: true
      });
    }
    // split unsecure acccount
    const shares = new KeyManager().getShares(Buffer.from(accounts[0].privateKey));
    await addWalletToUser({
      userId: 'user-id',
      mnemonic, // enecrypt with password as well
      network: this.networkSlug as any,
      address: accounts[0].address,
      shareA: shares[0],
      shareB: shares[1],
      shareC: shares[2],
    });

    return {
      mnemonic,
      accounts
    }
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

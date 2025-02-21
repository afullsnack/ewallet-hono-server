import {AccountCreationInput, AccountCreationResult, BaseChainStrategy} from "./base.strategy";
import {createHDAccounts} from "../helpers/wallet";
import bip39 from "bip39";

export class EVMChainStrategy extends BaseChainStrategy {

  private PATH = `m/44'/60'/0'/0/0` // use evm path

  // remove parameter requirements if no use
  async createAccount(params: AccountCreationInput): Promise<AccountCreationResult> {
      const {mnemonic, accounts} = await createHDAccounts({
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

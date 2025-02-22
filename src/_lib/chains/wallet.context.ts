import { AccountCreationInput, AccountRecoveryInput, IBaseChainStrategy } from "./base.strategy";
import { Network } from "../helpers/config";
import { EVMChainStrategy } from "./evm.strategy";

export class WalletContext {
  // map strategy to network:w
  private strategy: IBaseChainStrategy;

  constructor(private network: Network) {
    switch(network) {
      case 'evm':
        this.strategy = new EVMChainStrategy();
        break;
      default:
        throw new Error('Network strategy not found');
    }
  }

  async createAccount(params:AccountCreationInput) {
    try {
      const creationResult = await this.strategy.createAccount(params);
      return creationResult;
    }
    catch(error: any) {
      console.log(error, {action: 'create-account', network: this.network});
      throw error;
    }
  }


  async recoverAccount(params: AccountRecoveryInput) {
    try {
      const recoveryResult = await this.strategy.recoverAccount(params);
      return recoveryResult;
    }
    catch(error: any) {
      console.error(error, {action: 'recover-account', network: this.network});
      throw error;
    }
  }


  async useAccount() {} // TODO: for internal transactions that require the private key without user adding password
}

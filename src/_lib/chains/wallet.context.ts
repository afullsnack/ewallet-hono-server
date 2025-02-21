import { AccountCreationInput, IBaseChainStrategy } from "./base.strategy";
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
}

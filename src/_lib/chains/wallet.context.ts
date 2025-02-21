import { IBaseChainStrategy } from "./base.strategy";
import { Network } from "../helpers/config";
import { EVMChainStrategy } from "./evm.strategy";


export class WalletContext {
  // map strategy to network:w
  private strategies: Record<Network, IBaseChainStrategy>;

  constructor(private network: Network) {
    switch(network) {
      case 'evm':
        this.strategies[network] = new EVMChainStrategy()
        break;
      default:
        throw new Error('Network strategy not found');
    }
  }

  async createAccount() {
    try {
      const creationResult = await this.strategies[this.network].createAccount();
      return creationResult;
    }
    catch(error: any) {
      console.log(error, {action: 'create-account', network: this.network});
      throw error;
    }
  }
}

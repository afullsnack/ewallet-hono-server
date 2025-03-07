import { AccountCreationInput, AccountRecoveryInput, IBaseChainStrategy } from "./base.strategy";
import { Network } from "../helpers/config";
import { EVMChainStrategy } from "./evm.strategy";
import { tryCatch } from "../try-catch";

export class WalletContext {
  // map strategy to network:w
  private strategy: IBaseChainStrategy;

  constructor(private network: Network) {
    switch (network) {
      case 'evm':
        this.strategy = new EVMChainStrategy();
        break;
      default:
        throw new Error('Network strategy not found');
    }
  }

  async createAccount(params: AccountCreationInput) {
    const { data: creationResult, error } = await tryCatch(
      this.strategy.createAccount(params),
      { action: 'create-account', network: this.network }
    );
    if (error) throw error;

    return creationResult;
  }

  async recoverAccount(params: AccountRecoveryInput) {
    const { data: recoveryResult, error } = await tryCatch(
      this.strategy.recoverAccount(params),
      { action: 'recover-account', network: this.network }
    );
    if (error) throw error;

    return recoveryResult;
  }

  async useAccount() { } // TODO: for internal transactions that require the private key without user adding password
}

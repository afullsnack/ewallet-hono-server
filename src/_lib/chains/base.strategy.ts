
interface IBaseChainStrategy {
  createAccount: (path: string) => Promise<void>;
  send: () => Promise<void>;
  receive: () => Promise<string>;
}

export abstract class BaseChainStrategy implements IBaseChainStrategy {
  abstract createAccount(path: string): Promise<void>;
  abstract send(): Promise<void>;
  abstract receive(): Promise<string>;
}

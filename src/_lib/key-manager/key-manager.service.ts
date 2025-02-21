// TODO: should contain all code concerning managing storing and verifying keys
// TODO: should adhere to strict contract interface
// TODO: should contain small helper functions and resuable types
import { split, combine } from "shamirs-secret-sharing-ts";
import "dotenv/config";
export interface IKeyManagerService {
  getShares(secret: Buffer): any[];
  recoverSecret(shares: any[]): Buffer;
};

export class KeyManager implements IKeyManagerService {
  constructor(private readonly shares?: number, private readonly threshold?: number) {
    if(!shares) {
      this.shares = Number(process.env.KEY_SHARES!);
    }
    if(!threshold) {
      this.threshold = Number(process.env.KEY_THRESHOLD!);
    }
  }

  getShares(secret: Buffer): Buffer[] {
    try {
      const shares = split(
        secret,
        {
          shares: this.shares,
          threshold: this.threshold
        }
      );
      return shares;
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error('Getting shares failed with type error', {
          cause: err
        });
      }
      throw new Error('Failed to split');
    }
  }

  recoverSecret(shares: Buffer[]): Buffer {
    try {
      const recovered = combine(shares);
      return recovered;
    } catch(err) {
      throw new Error('Failed to combine');
    }
  }
}

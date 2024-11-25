// TODO: should contain all code concerning managing storing and verifying keys
// TODO: should adhere to strict contract interface
// TODO: should contain small helper functions and resuable types
import { split, combine } from "shamirs-secret-sharing-ts";
export interface IKeyManagerService {
  getShares(secret: Buffer): any[];
  recoverSecret(shares: any[]): Buffer;
};

export class KeyManager implements IKeyManagerService {
  constructor(private readonly shares: number, private readonly threshoold: number) { }

  getShares(secret: Buffer): any[] {
    try {
      const shares = split(
        secret,
        {
          shares: this.shares,
          threshold: this.threshoold
        }
      );
      return shares;
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error('Getting shares failed with type error', { cause: err });
      }
      throw new Error('Failed to split');
    }
  }

  recoverSecret(shares: any[]): Buffer {
    try {
      const recovered = combine(shares);
      return recovered;
    } catch(err) {
      throw new Error('Failed to combine');
    }
  }
}

import {describe, test, expect} from "vitest";
import { KeyManager } from "../key-manager.service";

describe("Given a share of 3 and threshold of 2 split secret and recombine", () => {
  const keyManager = new KeyManager();
  const privateKey = '0xb197098c7271a7ca808cb5b1f663a4c03762bd1b2d61d80c23ed1a4f617ae534';
  let shares: Array<Buffer>;

  test("it should split the given secret into 3 shares", () => {
    shares = keyManager.getShares(Buffer.from(privateKey, 'utf-8'));
    console.log(shares.map(share => share.toString('utf-8')), ":::shares of split secret");
    expect(shares.length).toBe(3);
  });

  test("it should recover secret given any 2 shares", () => {
    const recovered = keyManager.recoverSecret([shares[0], shares[2]], 'utf-8');
    console.log(recovered, ":::recovered secret");
    expect(recovered).toEqual(privateKey);
  });
})

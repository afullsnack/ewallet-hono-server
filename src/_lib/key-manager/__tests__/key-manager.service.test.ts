import {describe, test, expect} from "vitest";
import { KeyManager } from "../key-manager.service";

describe("Given a share of 3 and threshold of 2 generate split secrets and recombine", () => {
  const keyManager = new KeyManager(3, 2);
  const privateKey = 'pk_sol230343nef9shdcnsdb20be2b0csc';
  let shares: Array<Buffer>;
  test("it should split the given secret into 3 shares", () => {
    shares = keyManager.getShares(Buffer.from(privateKey));
    console.log(shares.map(share => share.toString()), ":::shares of split secret");
    expect(shares.length).toBe(3);
  });

  test("it should recover secret given any 2 shares", () => {
    const recovered = keyManager.recoverSecret([shares[0], shares[2]]);
    console.log(recovered.toString(), ":::recovered secret");
    expect(recovered.toString()).toEqual(privateKey);
  });
})

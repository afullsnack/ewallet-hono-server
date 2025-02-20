import {describe, test, expect} from "vitest";
import {CryptoUtil} from "../hasher";

test("should hash given input", () => {
  const input = 'secret';
  const password = 'password';
  const wrongPassword = 'wrongPassword';

  const encrypted = CryptoUtil.encrypt(input,password);
  const decrypted = CryptoUtil.decrypt(encrypted, wrongPassword);
  console.log(encrypted, ":::encrypted data");
  console.log(decrypted, ":::decrypted data");
  expect(decrypted).toThrowError();
})

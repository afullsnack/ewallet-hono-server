import {describe, test, expect} from "vitest";
import {WalletContext} from "../wallet.context";

test("should create evm accounts", async () => {
  const walletContext = new WalletContext('evm');
  const account = await walletContext.createAccount();
  console.log(account, ":::evm account created");
  expect(account).toHaveProperty('mnemonic');
  expect(account).toHaveProperty('accounts');
  expect(account.accounts.length).toBeGreaterThan(0);
}, {timeout: 1000*4})

// test 2 - encrypt private key and split to shares
// > save data to db

import { describe, test, expect } from "vitest";
import { WalletContext } from "../wallet.context";
import { getWallet } from "../../../db";


const TEST_CONFIG = { timeout: 1000 * 4 };


let mnemonic: string;
let address: string;
let privateKey: string;

test("should create evm accounts", async () => {
  const walletContext = new WalletContext('evm');
  const account = await walletContext.createAccount({});
  console.log(account, ":::evm account created");
  mnemonic = account.mnemonic;
  address = account.accounts[0].address;
  privateKey = account.accounts[0].privateKey;
  expect(account).toHaveProperty('mnemonic');
  expect(account).toHaveProperty('accounts');
  expect(account.accounts.length).toBeGreaterThan(0);
}, TEST_CONFIG)


// test 3 - test account persistence with the same mnemonic
test("should re-create the same account with the same mnemonic", async () => {
  const walletContext = new WalletContext('evm');
  const account = await walletContext.createAccount({ mnemonic });
  console.log(account, ":::evm account created");

  const newAddress = account.accounts[0].address;
  const newPrivateKey = account.accounts[0].privateKey;
  const newMnemonic = account.mnemonic;

  expect(newAddress).toEqual(address);
  expect(newMnemonic).toEqual(mnemonic);
  expect(newPrivateKey).toEqual(privateKey);
}, TEST_CONFIG);

// test 2 - encrypt private key and split to shares
// > save data to db

test("should create keys, split to shares and save in db", async () => {
  try {
    const password = 'kiloBYTE1234!';
    const walletContext = new WalletContext("evm");
    const account = await walletContext.createAccount({
      password,
    });
    console.log(account, ":::created account");
  }
  catch (error: any) {
    console.log(error, { action: 'creatig-account' });
    throw error;
  }
}, TEST_CONFIG);


test.only("should recover keys with with password and backup db", async () => {
  try {
    const wallet = await getWallet('f006dfbd-fb54-4a19-8cbb-fd9e5611eb15');
    const password = 'kiloBYTE1234!';
    const walletContext = new WalletContext("evm");
    const recovery = await walletContext.recoverAccount({
      password,
      backupShare: wallet?.shareB!,
      walletId: 'f006dfbd-fb54-4a19-8cbb-fd9e5611eb15'
    });
    console.log(recovery, ":::recovered account");
  }
  catch (error: any) {
    console.log(error, { action: 'creatig-account' });
    throw error;
  }
}, TEST_CONFIG);


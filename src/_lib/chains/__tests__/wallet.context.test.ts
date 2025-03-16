import { describe, test, expect } from "vitest";
import { WalletContext } from "../wallet.context";
import { getWallet } from "../../../db";
import * as ImageConverter from "image-conversion";

const TEST_CONFIG = { timeout: 1000 * 4 };


let mnemonic: string;
let address: string;
let privateKey: string;
const userId = 'usr_sdonbasodvoboasv';

test("should create evm accounts", async () => {
  const walletContext = new WalletContext('evm');
  const account = await walletContext.createAccount({userId});
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
  const account = await walletContext.createAccount({ mnemonic, userId });
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
      userId
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
    const wallet = await getWallet('fa03f085-2253-4bce-bba2-dee23afe8b01');
    const password = 'password123!!!';
    const walletContext = new WalletContext("evm");
    const recovery = await walletContext.recoverAccount({
      password,
      backupShare: wallet?.shareB!,
      walletId: wallet?.id!
    });
    console.log(recovery, ":::recovered account");
  }
  catch (error: any) {
    console.log(error, { action: 'creatig-account' });
    throw error;
  }
}, TEST_CONFIG);


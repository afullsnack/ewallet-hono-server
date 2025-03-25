import { AccountCreationInput, AccountCreationResult, AccountRecoveryInput, AccountRecoveryResult, BaseChainStrategy } from "./base.strategy";
import { createHDAccounts } from "../helpers/wallet";
import bip39 from "bip39";
import { CryptoUtil } from "../helpers/hasher";
import { KeyManager } from "../key-manager/key-manager.service";
import { addWalletToUser, db, getUserWithWallets, getWalletWithUser, updateUser, updateWallet } from "../../db";
import { privateKeyToAddress } from "viem/accounts";
import { Address, ChainDoesNotSupportContract, Hex } from "viem";
import { getNexusClient } from "../biconomy/client.mts";
import { chainLogos, defaultChainIds, defaultNativeTokens, defaultUSDCTokens, defaultUSDTTokens } from "../utils";
import { wallet } from "src/db/schema";
import { eq } from "drizzle-orm";

export class EVMChainStrategy extends BaseChainStrategy {

  private PATH = `m/44'/60'/0'/0/0` // use evm path
  private networkSlug = 'evm';

  // remove parameter requirements if no use
  async createAccount(params: AccountCreationInput): Promise<AccountCreationResult> {
    const { mnemonic, accounts } = await createHDAccounts({
      mnemonic: params.mnemonic ?? bip39.generateMnemonic(),
      numberOfAccounts: 1,
      startIndex: 0,
      basePath: this.PATH
    });
    const walletPK = accounts[0]!.privateKey;
    console.log(walletPK, ":::created pk");

    const nClient = await getNexusClient(walletPK);
    const smartAddress = nClient.account.address;

    const defaultTokens = defaultNativeTokens.concat(defaultUSDTTokens, defaultUSDCTokens);
    // update isBackedUp
    let encryptedPk: string;
    let hashedPassword: string;
    if (params.password) {
      // encryptedPk = CryptoUtil.encrypt(accounts[0]!.privateKey, params.password);
      const encryptedMnemonic = CryptoUtil.encrypt(mnemonic, params.password);
      hashedPassword = CryptoUtil.hash(params.password);
      const shares = new KeyManager().getShares(Buffer.from(walletPK, 'utf16le'));
      await Promise.all(defaultChainIds.map(id => addWalletToUser({
        userId: params.userId,
        mnemonic: encryptedMnemonic, // enecrypt with password as well
        network: this.networkSlug as any,
        address: smartAddress,
        privateKey: walletPK,
        chainId: id.toString(),
        chainLogo: chainLogos[id],
        tokens: defaultTokens.filter((token) => token.chain === id),
        shareA: shares[0]?.toString('utf16le'),
        shareB: shares[1]?.toString('utf16le'),
        shareC: shares[2]?.toString('utf16le'),
        recoveryPassword: hashedPassword,
      })));

      return {
        // accountId: result[0].id,
        address: smartAddress
      }
    }
    throw new Error('Password not set for wallet!')
    // split unsecure acccount
    // const shares = new KeyManager().getShares(Buffer.from(accounts[0]!.privateKey));
    // const result = await addWalletToUser({
    //   userId: params.userId,
    //   mnemonic, // enecrypt with password as well
    //   network: this.networkSlug as any,
    //   address: smartAddress,
    //   shareA: shares[0]?.toString('utf16le'),
    //   shareB: shares[1]?.toString('utf16le'),
    //   shareC: shares[2]?.toString('utf16le'),
    // });
    // await updateUser(params.userId, {
    //   chains: defaultChainIds.map(id => id.toString()),
    //   tokens: defaultUSDCTokens.concat(defaultUSDTTokens)
    // })

    // return {
    //   accountId: result!.id,
    //   address: smartAddress
    // }
  }


  async recoverAccount(params: AccountRecoveryInput): Promise<AccountRecoveryResult & { address: string }> {
    const account = await getWalletWithUser(params.walletId);
    if (!account) throw new Error('Wallet not found');
    if (!account.recoveryPassword) {
      throw new Error('Password has not been set, wallet has not been created');
    }
    const isValidPassword = CryptoUtil.verify(account.recoveryPassword, params.password);

    if (isValidPassword) {
      // const shares = [
      //   Buffer.from(account.shareB!, 'utf16le'),
      //   Buffer.from(account.shareA!, 'utf16le')
      // ]

      // console.log(account.shareB, ":::share B")
      // console.log(account.shareA, ":::share A")
      // shares.forEach((share) => console.log(share, "share in array"))
      // const recovered = new KeyManager().recoverSecret(shares, 'utf16le')
      // console.log(recovered, ":::recovered")
      const { accounts } = await createHDAccounts({
        mnemonic: params.mnemonic ?? bip39.generateMnemonic(),
        numberOfAccounts: 1,
        startIndex: 0,
        basePath: this.PATH
      });
      const walletPK = accounts[0]!.privateKey;

      console.log(walletPK, ":::wallet PK")
      // update user with default configs

      const nClient = await getNexusClient(`${walletPK}`);
      const smartAddress = nClient.account.address;
      // const privateKey = CryptoUtil.decrypt(encryptedPK.toString(), params.password);
      const user = await getUserWithWallets(account.user.id)
      if (!user) throw new Error('User with wallet not found')
      const defaultTokens = defaultNativeTokens.concat(defaultUSDTTokens, defaultUSDCTokens);

      for (const w of user.wallets) {
        if (w.chainId === null || w.tokens === null) {
          await db.delete(wallet).where(eq(wallet.id, w.id))
        }
      }

      const addWalletsPromises = defaultChainIds.map(async (id) => {
        const wallet = user.wallets.find((w) => w.chainId === id.toString());
        if (wallet) {
          return undefined;
        }
        return await addWalletToUser({
          mnemonic: params.mnemonic, // enecrypt with password as well
          network: this.networkSlug as any,
          address: smartAddress,
          // ...account,
          shareA: account.shareA,
          shareB: account.shareB,
          shareC: account.shareC,
          isBackedUp: account.isBackedUp,
          userId: user.id,
          privateKey: walletPK,
          chainId: id.toString(),
          chainLogo: chainLogos[id],
          tokens: defaultTokens.filter((token) => token.chain === id),
          recoveryPassword: account.recoveryPassword,
        })
      })
      console.log("Wallet promises:::", addWalletsPromises)
      await Promise.all(
        addWalletsPromises
      )

      return {
        encryptedPrivateKey: walletPK,
        privateKey: walletPK,
        address: smartAddress,
      }
    }

    throw new Error('Password is not valid');
  }

  // send logic for EVM chains, implement with viem
  async send(): Promise<string> {
    throw new Error('Not implemented');
  }

  // get address to receive from db
  async receive(chainId: number, userId: string): Promise<string> {
    const user = await getUserWithWallets(userId);

    const address = user?.wallets.find((w) => w.network === 'evm')?.address
    return address!;
  }

}

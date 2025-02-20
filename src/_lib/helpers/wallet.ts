// handle keypair generation for different networks
import { 
  mnemonicToAccount,
  generateMnemonic,
  privateKeyToAddress,
  type Address,
} from 'viem/accounts'
import { toHex } from 'viem'
import { WORD_LIST } from './config'

interface CreateHDAccountsOptions {
  /** Mnemonic phrase to use. If not provided, a new one will be generated */
  mnemonic?: string
  /** Number of accounts to generate. Default is 1 */
  numberOfAccounts?: number
  /** Starting index for account derivation. Default is 0 */
  startIndex?: number
  /** Custom derivation path prefix. Default is "m/44'/60'/0'/0" */
  basePath?: string
  /** Password for extra security (optional) */
  password?: string
  /** Network to create account for */
  network?: string
}
interface HDAccount {
  address: Address
  privateKey: Address
  publicKey: any | Address
  index: number
  path: string
}
/**
 * Creates HD wallet accounts using viem
 * @param options Configuration options for HD account creation
 * @returns Array of HD accounts with their details
 */
export async function createHDAccounts({
  mnemonic = generateMnemonic(WORD_LIST), // provide wordlist
  numberOfAccounts = 1,
  startIndex = 0,
  basePath = "m/44'/60'/0'/0",
}: CreateHDAccountsOptions = {}): Promise<{
  mnemonic: string
  accounts: HDAccount[]
}> {
  try {
    // Create HD wallet from mnemonic
    const account = mnemonicToAccount(mnemonic)
    const hdKey = account.getHdKey();

    const accounts: HDAccount[] = []

    // Derive specified number of accounts
    for (let i = startIndex; i < startIndex + numberOfAccounts; i++) {
      // Derive child key at index
      const path = `${basePath}/${i}`
      const childKey = hdKey.derive(path)

      if (!childKey.privateKey) {
        throw new Error(`Failed to derive private key for path: ${path}`)
      }

      // Convert private key to hex
      const privateKey = toHex(childKey.privateKey)
      
      // Generate address from private key
      const address = privateKeyToAddress(privateKey)

      accounts.push({
        address,
        privateKey,
        publicKey: childKey.publicKey,
        index: i,
        path
      })
    }

    return {
      mnemonic,
      accounts
    }
  } catch (error) {
    throw new Error(`Failed to create HD accounts: ${(error as Error).message}`)
  }
}

/**
 * Validates a mnemonic phrase
 * @param mnemonic Mnemonic phrase to validate
 * @returns boolean indicating if mnemonic is valid
 */
export function isValidMnemonic(mnemonic: string): boolean {
  try {
    // Split and check word count
    const words = mnemonic.trim().split(' ')
    if (![12, 15, 18, 21, 24].includes(words.length)) {
      return false
    }

    // Try to create an account from it (will throw if invalid)
    mnemonicToAccount(mnemonic)
    return true
  } catch {
    return false
  }
}

/**
 * Retrieves an account at a specific HD path
 * @param mnemonic Mnemonic phrase
 * @param path HD path
 * @returns HD account details
 */
export async function getAccountAtPath(
  mnemonic: string,
  path: string,
): Promise<HDAccount> {
  const account = mnemonicToAccount(mnemonic)
  const hdKey = account.getHdKey();
  
  const childKey = hdKey.derive(path)
  if (!childKey.privateKey) {
    throw new Error(`Failed to derive private key for path: ${path}`)
  }

  const privateKey = toHex(childKey.privateKey)
  const address = privateKeyToAddress(privateKey)

  return {
    address,
    privateKey,
    publicKey: childKey.publicKey,
    index: parseInt(path.split('/').pop() || '0'),
    path
  }
}

// Example usage:
/*
// Generate new accounts
const { mnemonic, accounts } = await createHDAccounts({
  numberOfAccounts: 3,
  startIndex: 0
})

// Create accounts from existing mnemonic
const result = await createHDAccounts({
  mnemonic: "your twelve word mnemonic phrase goes right here",
  numberOfAccounts: 2
})

// Get specific account by path
const account = await getAccountAtPath(
  mnemonic,
  "m/44'/60'/0'/0/5"
)

// Validate mnemonic
const isValid = isValidMnemonic("your mnemonic phrase")
*/

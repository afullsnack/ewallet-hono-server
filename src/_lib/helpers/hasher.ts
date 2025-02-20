// import { randomBytes, pbkdf2Sync, createHash, createCipheriv, createDecipheriv, scryptSync } from 'node:crypto';
import * as crypto from "crypto";
const ENCRYPTION_KEY = '';

export class Hasher {

  // static encrypt(text: any) {
  //   const iv = crypto.randomBytes(16);
  //   const key = Buffer.from(ENCRYPTION_KEY);
  //   const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  //   let encrypted = cipher.update(text);
  //   encrypted = Buffer.concat([encrypted, cipher.final()]);
  //   return iv.toString("hex") + ":" + encrypted.toString("hex");
  // }

  // static decrypt(hash: string) {
  //   const [ivHex, encryptedHex] = hash.split(":");
    // const iv = Buffer.from(ivHex, "hex");
  //   const encrypted = Buffer.from(encryptedHex, "hex");
  //   const decipher = crypto.createDecipheriv(
  //     "aes-256-cbc",
  //     Buffer.from(ENCRYPTION_KEY).toString("utf8"),
  //     iv,
  //   );
  //   let decrypted = decipher.update(encrypted);
  //   decrypted = Buffer.concat([decrypted, decipher.final()]);
  //   return decrypted.toString();
  // }
}
export class CryptoUtil {
  // Using AES-256-GCM for authenticated encryption
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SALT_LENGTH = 32;
  private static readonly IV_LENGTH = 12;  // 96 bits for GCM
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;  // 256 bits
  private static readonly ITERATIONS = 100000;

  /**
   * Generates a cryptographic key from a password using PBKDF2
   */
  private static deriveKey(password: string, salt: any) {
    return crypto.scryptSync(password, salt, this.KEY_LENGTH, {
      N: 16384,  // CPU/memory cost parameter
      r: 8,      // Block size parameter
      p: 1       // Parallelization parameter
    });
  }
  
  public static hash(password: string) {
    const hash = crypto.createHash("sha256"); // You can choose a different algorithm if needed
    hash.update(password);
    return hash.digest("hex");
  }

  public static verify(storedHash: string, inputString: string) {
    const hash = crypto.createHash("sha256"); // You can choose a different algorithm if needed
    hash.update(inputString);
    const hashString = hash.digest("hex");
    return hashString === storedHash;
  }

  /**
   * Encrypts data using AES-256-GCM with a password
   * @param data - The data to encrypt (string or Buffer)
   * @param password - The password to use for encryption
   * @returns Base64 encoded encrypted data with salt and IV
   */
  public static encrypt(data: string | Buffer, password: string): string {
    try {
      // Generate a random salt and IV
      const salt = new Uint8Array(crypto.randomBytes(this.SALT_LENGTH));
      const iv = new Uint8Array(crypto.randomBytes(this.IV_LENGTH));

      // Derive key from password and salt
      const key = new Uint8Array(this.deriveKey(password, salt));

      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
        authTagLength: this.AUTH_TAG_LENGTH
      });

      // Encrypt the data
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
      const encryptedData = Buffer.concat([
        cipher.update(dataBuffer),
        cipher.final()
      ]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine all components
      const combined = Buffer.concat([
        salt,           // 32 bytes
        iv,            // 12 bytes
        authTag,       // 16 bytes
        encryptedData  // Variable length
      ]);

      return combined.toString('base64');
    } catch (error: any) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypts data that was encrypted using encrypt()
   * @param encryptedData - Base64 encoded encrypted data
   * @param password - The password used for encryption
   * @returns Decrypted data as a string
   */
  public static decrypt(encryptedData: string, password: string): string {
    try {
      // Convert from base64
      const data = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = data.subarray(0, this.SALT_LENGTH);
      const iv = data.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const authTag = data.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH
      );
      const encryptedContent = data.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH);

      // Derive key from password and salt
      const key = this.deriveKey(password, salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
        authTagLength: this.AUTH_TAG_LENGTH
      });

      // Set auth tag
      decipher.setAuthTag(authTag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encryptedContent),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error: any) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Validates if a string is a valid base64 encoded encrypted data
   * @param encryptedData - The data to validate
   * @returns boolean indicating if the data appears to be valid
   */
  public static isValidEncryptedData(encryptedData: string): boolean {
    try {
      const data = Buffer.from(encryptedData, 'base64');
      const minimumLength = this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH;
      return data.length >= minimumLength;
    } catch {
      return false;
    }
  }
}

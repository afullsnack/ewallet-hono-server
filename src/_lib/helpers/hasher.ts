import * as crypto from "crypto";

export class Hasher {
  static hash(password: string) {
    const hash = crypto.createHash("sha256"); // You can choose a different algorithm if needed
    hash.update(password);
    return hash.digest("hex");
  }

  static verify(storedHash: string, inputString: string) {
    const hash = crypto.createHash("sha256"); // You can choose a different algorithm if needed
    hash.update(inputString);
    const hashString = hash.digest("hex");
    return hashString === storedHash;
  }

  static encrypt(text: any) {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  static decrypt(hash: string) {
    const [ivHex, encryptedHex] = hash.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY).toString("utf8"),
      iv,
    );
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}

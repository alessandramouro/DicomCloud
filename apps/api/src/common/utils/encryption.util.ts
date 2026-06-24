import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/** Config keys treated as secrets across StorageDestination.config (clinic storage, exports, agent runtime config). */
export const SENSITIVE_CONFIG_FIELDS = ['password', 'accessKeyId', 'secretAccessKey', 'accessToken', 'refreshToken'];

export class EncryptionUtil {
  static encrypt(text: string, key: string): string {
    const salt = randomBytes(SALT_LENGTH);
    const derivedKey = scryptSync(key, salt, 32);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, derivedKey, iv);

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, authTag, encrypted]).toString('base64');
  }

  static decrypt(encryptedText: string, key: string): string {
    const buffer = Buffer.from(encryptedText, 'base64');
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    const derivedKey = scryptSync(key, salt, 32);
    const decipher = createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(encrypted) + decipher.final('utf8');
  }

  static encryptObject(obj: Record<string, unknown>, key: string): string {
    return EncryptionUtil.encrypt(JSON.stringify(obj), key);
  }

  static decryptObject<T = Record<string, unknown>>(encryptedText: string, key: string): T {
    return JSON.parse(EncryptionUtil.decrypt(encryptedText, key)) as T;
  }

  static mask(value: string, visibleChars = 4): string {
    if (value.length <= visibleChars) return '****';
    return value.substring(0, visibleChars) + '*'.repeat(Math.min(value.length - visibleChars, 8));
  }

  static encryptFields(
    config: Record<string, unknown>,
    fields: string[],
    key: string,
  ): Record<string, unknown> {
    const result = { ...config };
    for (const field of fields) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = EncryptionUtil.encrypt(result[field] as string, key);
      }
    }
    return result;
  }

  /** Tolerant of legacy/never-encrypted values — leaves a field as-is if it fails to decrypt. */
  static decryptFields(
    config: Record<string, unknown>,
    fields: string[],
    key: string,
  ): Record<string, unknown> {
    const result = { ...config };
    for (const field of fields) {
      if (result[field] && typeof result[field] === 'string') {
        try {
          result[field] = EncryptionUtil.decrypt(result[field] as string, key);
        } catch {
          // Field was never encrypted (e.g. legacy/plaintext config) — leave as-is
        }
      }
    }
    return result;
  }
}

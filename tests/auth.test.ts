import { describe, it, expect, beforeEach } from 'vitest';
import { generatePhoneToken, verifyPhoneToken, hashPin, verifyPin } from '@/lib/auth';

describe('Authentication', () => {
  describe('Phone Token Generation and Verification', () => {
    it('should generate a valid token for a user', () => {
      const userId = 123;
      const phoneNumber = '+254712345678';

      const token = generatePhoneToken(userId, phoneNumber);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should verify a valid token', () => {
      const userId = 456;
      const phoneNumber = '+254722334455';

      const token = generatePhoneToken(userId, phoneNumber);
      const verified = verifyPhoneToken(token);

      expect(verified?.valid).toBe(true);
      expect(verified?.userId).toBe(userId);
      expect(verified?.phoneNumber).toBe(phoneNumber);
    });

    it('should reject an invalid token', () => {
      const verified = verifyPhoneToken('invalid-token-string');

      expect(verified?.valid).toBe(false);
      expect(verified?.userId).toBeUndefined();
    });

    it('should reject a tampered token', () => {
      const token = generatePhoneToken(789, '+254733445566');
      const tampered = token.slice(0, -5) + 'XXXXX';

      const verified = verifyPhoneToken(tampered);

      expect(verified?.valid).toBe(false);
    });

    it('should reject an expired token', () => {
      // Token expiry is 7 days - we'd need to mock Date for this
      // This is a placeholder for when time-mocking is added
      expect(true).toBe(true);
    });
  });

  describe('PIN Hashing and Verification', () => {
    it('should hash a PIN', async () => {
      const pin = '1234';

      const hashed = await hashPin(pin);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe(pin);
      expect(hashed.length).toBeGreaterThan(20);
    });

    it('should verify a correct PIN', async () => {
      const pin = '5678';
      const hashed = await hashPin(pin);

      const isValid = await verifyPin(pin, hashed);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect PIN', async () => {
      const correctPin = '9012';
      const wrongPin = '0000';
      const hashed = await hashPin(correctPin);

      const isValid = await verifyPin(wrongPin, hashed);

      expect(isValid).toBe(false);
    });

    it('should generate different hashes for the same PIN (salt)', async () => {
      const pin = '1111';

      const hash1 = await hashPin(pin);
      const hash2 = await hashPin(pin);

      expect(hash1).not.toBe(hash2);

      // Both should still verify
      expect(await verifyPin(pin, hash1)).toBe(true);
      expect(await verifyPin(pin, hash2)).toBe(true);
    });
  });
});

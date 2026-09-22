// NIST CSF PROTECT (Access Control) / IDENTIFY (Identity)
// Real HMAC-SHA256 signed JWT authentication for Arena Africa

import crypto from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || "arena-dev-secret-change-in-production";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthUser {
  id: number;
  phoneNumber: string;
  name: string;
  country: string;
  currency: string;
  balance: number;
}

export interface AuthContext {
  userId: number;
  user: AuthUser;
  isAuthenticated: boolean;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
}

/** Create a signed session token for a user (real HMAC, not simulated) */
export function generatePhoneToken(userId: number, phoneNumber: string): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Date.now();
  const payload = base64url(
    JSON.stringify({ sub: userId, phone: phoneNumber, iat: now, exp: now + TOKEN_TTL_MS })
  );
  const signature = sign(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

/** Verify a signed token. Returns userId or null. Timing-safe comparison. */
export function verifyPhoneToken(token: string): { userId: number; valid: boolean } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    // Timing-safe signature comparison
    const expected = sign(`${header}.${payload}`);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!decoded.sub || !decoded.exp) return null;
    if (Date.now() > decoded.exp) return null; // expired

    return { userId: Number(decoded.sub), valid: true };
  } catch {
    return null;
  }
}

/** Hash a PIN with a per-user salt (scrypt — no native build required) */
export function hashPin(pin: string, salt: string): string {
  return crypto.scryptSync(pin, salt, 64).toString("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function verifyPin(pin: string, salt: string, storedHash: string): boolean {
  try {
    const candidate = hashPin(pin, salt);
    const a = Buffer.from(candidate, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

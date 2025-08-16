// Edge-safe auth utilities (no Node 'crypto' or 'jsonwebtoken' deps)

import type { NextRequest } from 'next/server';

/** ---------- Domain Models ---------- */
export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  role: Role;
}

export interface UserRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface Order {
  id: string;
  userId: string;
  ecwidOrderId: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  currency: string;
  items: any[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyClaim {
  id: string;
  userId: string;
  orderId: string;
  productName: string;
  serialNumber: string;
  issue: string;
  /** include legacy statuses used by some pages to avoid TS errors */
  status:
    | 'submitted'
    | 'review'
    | 'approved'
    | 'rejected'
    | 'resolved'
    | 'under_review'
    | 'completed';
  submittedAt: string;
  updatedAt: string;
  /** optional notes used on some UI screens */
  notes?: string;
}

/** ---------- Config / helpers ---------- */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/** Convert a Uint8Array view to a *real* ArrayBuffer (no SharedArrayBuffer union). */
function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(view.byteLength);
  new Uint8Array(ab).set(view);
  return ab;
}

/** Use an env var when available; fall back to a dev secret so local builds work. */
function getSecret(): string {
  return (process.env.AUTH_SECRET || 'dev-secret-please-set-AUTH_SECRET').toString();
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(textEncoder.encode(getSecret())),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** URL-safe base64 helpers (no Node Buffer) */
function b64urlEncode(bytesOrString: Uint8Array | string): string {
  const bytes = typeof bytesOrString === 'string' ? textEncoder.encode(bytesOrString) : bytesOrString;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function b64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const bin = atob(base64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a[i] ^ b[i];
  return res === 0;
}

/** ---------- Password hashing (PBKDF2-SHA256) ---------- */

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_KEY_BITS = 256;

/** Stored format: `pbkdf2$<iter>$<salt_b64url>$<hash_b64url>` */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));

  const baseKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(textEncoder.encode(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    PBKDF2_KEY_BITS
  );

  const hash = new Uint8Array(bits);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64urlEncode(salt)}$${b64urlEncode(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, iterStr, saltB64, hashB64] = stored.split('$');
    if (scheme !== 'pbkdf2') return false;
    const iterations = parseInt(iterStr, 10);
    const salt = b64urlDecode(saltB64);
    const expected = b64urlDecode(hashB64);

    const baseKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(textEncoder.encode(password)),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations, hash: 'SHA-256' },
      baseKey,
      expected.length * 8
    );

    const actual = new Uint8Array(bits);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// alias some projects expect
export const verifyPasswordHash = verifyPassword;

/** ---------- JWT (HS256) implemented with WebCrypto ---------- */

export interface JwtPayload {
  sub: string; // user id
  role: Role;
  email?: string;
  iat: number; // issued at (seconds)
  exp: number; // expiry (seconds)
  [key: string]: unknown;
}

export interface JwtInput {
  sub: string;
  role: Role;
  email?: string;
  [key: string]: unknown;
}

export async function signToken(
  payload: JwtInput,
  opts?: { expiresInSeconds?: number }
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (opts?.expiresInSeconds ?? 60 * 60 * 24 * 7); // default: 7 days

  const headerSeg = b64urlEncode(JSON.stringify(header));
  const payloadSeg = b64urlEncode(JSON.stringify({ ...payload, iat, exp }));
  const data = `${headerSeg}.${payloadSeg}`;

  const key = await getHmacKey();
  const sigBuf = await crypto.subtle.sign('HMAC', key, toArrayBuffer(textEncoder.encode(data)));
  const sigBytes = new Uint8Array(sigBuf);
  const sigSeg = b64urlEncode(sigBytes);
  return `${data}.${sigSeg}`;
}

/** Keep existing verifiers */
export async function verifyToken(token: string): Promise<JwtPayload> {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new Error('Malformed token');

  const data = `${h}.${p}`;
  const key = await getHmacKey();
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    toArrayBuffer(b64urlDecode(s)),
    toArrayBuffer(textEncoder.encode(data))
  );
  if (!ok) throw new Error('Invalid signature');

  const payload = JSON.parse(textDecoder.decode(b64urlDecode(p))) as JwtPayload;
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && now > payload.exp) throw new Error('Token expired');

  return payload;
}

/** ---------- Request helper ---------- */

export async function getUserFromRequest(
  request: NextRequest
): Promise<{ id: string; email?: string; role: Role } | null> {
  try {
    // Prefer Authorization header; fallback to cookie 'auth_token'
    const authz = request.headers.get('authorization') || '';
    const bearer = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7).trim() : null;
    const cookie = request.cookies?.get?.('auth_token')?.value ?? null;
    const token = bearer || cookie;
    if (!token) return null;

    const payload = await verifyToken(token);
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

/** ---------- Small utility for IDs (mirrors database.ts usage) ---------- */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** ---------- Minimal validators + compatibility exports ---------- */

/** Simple email format check used by routes */
export function validateEmail(email: string): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Simple password rule (match existing UI expectations) */
export function validatePassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 8;
}

/** Keep legacy name expected by routes */
export const generateToken = signToken;

/**
 * Ecwid SSO token helper used by /api/ecwid/sso route.
 * Produces a compact HMAC-signed blob from the given fields.
 */
export async function generateEcwidSSOToken(input: {
  email: string;
  customerId?: string;
  name?: string;
  ttlSeconds?: number;
}): Promise<string> {
  const secret = (process.env.ECWID_SSO_SECRET || '').toString();
  if (!secret) throw new Error('Missing ECWID_SSO_SECRET');

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (input.ttlSeconds ?? 10 * 60);

  // Minimal, deterministic string to sign (avoid JSON key order issues)
  const parts = [
    `email=${encodeURIComponent(input.email)}`,
    input.customerId ? `customer_id=${encodeURIComponent(input.customerId)}` : null,
    input.name ? `name=${encodeURIComponent(input.name)}` : null,
    `iat=${now}`,
    `exp=${exp}`,
  ]
    .filter(Boolean)
    .join('&');

  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(textEncoder.encode(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, toArrayBuffer(textEncoder.encode(parts)));
  const sig = b64urlEncode(new Uint8Array(sigBuf));

  // Return a compact token string; the route can append this to redirects/URLs
  return `${parts}&sig=${sig}`;
}

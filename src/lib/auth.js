import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sportspace_secret_key_2024'
);

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export function validateEmail(email) {
  return /^[\w.-]+@[\w.-]+\.\w{2,}$/.test(email);
}

export function validatePhone(phone) {
  return /^[\d+\-\s]{7,20}$/.test(phone);
}

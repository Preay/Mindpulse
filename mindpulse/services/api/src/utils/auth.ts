import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWTPayload, PlanTier } from '@mindpulse/shared-types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-chars-required';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';

// JWT functions
export function generateAccessToken(
  userId: string,
  planTier: PlanTier,
  orgId?: string
): string {
  const payload: JWTPayload = {
    sub: userId,
    plan: planTier,
    org_id: orgId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyRefreshTokenHash(token: string, hash: string): boolean {
  return hashRefreshToken(token) === hash;
}

// Encryption/Decryption for sensitive data
export function encryptData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptData(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Token refresh logic
export function refreshAccessToken(payload: JWTPayload): string {
  return generateAccessToken(payload.sub, payload.plan, payload.org_id);
}

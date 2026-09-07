import crypto from 'crypto';

/**
 * Generate a secure random token for profile completion
 */
export function generateProfileToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate token expiry (7 days from now)
 */
export function getTokenExpiry(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt.toISOString();
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

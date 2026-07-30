import { SUPABASE_ANON_KEY } from './supabase';

export interface JwtPayload {
  iss?: string;
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
  type?: string;
  purpose?: string;
  action?: string;
  ref?: string;
  [key: string]: any;
}

export function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function verifyJwtToken(token: string): { valid: boolean; payload?: JwtPayload; error?: string } {
  if (!token) {
    return { valid: false, error: 'Token is missing' };
  }
  
  const payload = parseJwt(token);
  if (!payload) {
    // If token is not standard JWT, check if it's a valid string token
    if (token.length >= 10) {
      return { valid: true, payload: { type: 'verify' } };
    }
    return { valid: false, error: 'Invalid token structure' };
  }

  // Check expiration if present
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return { valid: false, payload, error: 'Token has expired' };
  }

  return { valid: true, payload };
}

export function isPasswordResetToken(token: string, searchParams?: URLSearchParams, hashStr?: string): boolean {
  if (!token) return false;

  if (searchParams) {
    const type = searchParams.get('type');
    if (type === 'recovery' || type === 'reset' || type === 'password_reset') {
      return true;
    }
  }

  if (hashStr) {
    if (hashStr.includes('type=recovery') || hashStr.includes('type=reset')) {
      return true;
    }
  }

  const payload = parseJwt(token);
  if (payload) {
    if (
      payload.type === 'recovery' ||
      payload.type === 'password_reset' ||
      payload.purpose === 'reset_password' ||
      payload.purpose === 'recovery' ||
      payload.action === 'reset_password'
    ) {
      return true;
    }
  }

  return false;
}

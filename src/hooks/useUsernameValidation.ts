import { useMemo } from 'react';

const RESTRICTED_USERNAMES = new Set([
  'support',
  'login',
  'profile',
  'admin',
  'help',
  'security',
  'garexcell',
  'official',
  'system',
  'mod',
  'moderator',
  'staff',
  'terms',
  'privacy',
  'settings',
  'auth',
  'api',
  'root',
  'dashboard',
  'account'
]);

export interface UsernameValidationResult {
  isValid: boolean;
  isReserved: boolean;
  isAllowedByEmail: boolean;
  warning: string | null;
  message: string | null;
}

/**
 * Custom React Hook to validate usernames in real-time.
 * Checks against restricted usernames ('support', 'login', 'profile', etc.).
 * Grants an exception if the user's email domain ends with '@garexcell.com'.
 */
export function useUsernameValidation(username: string, email?: string): UsernameValidationResult {
  return useMemo(() => {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanEmail = (email || '').trim().toLowerCase();
    const isGarexcellEmail = cleanEmail.endsWith('@garexcell.com');

    if (!cleanUsername) {
      return {
        isValid: false,
        isReserved: false,
        isAllowedByEmail: false,
        warning: null,
        message: null
      };
    }

    const isReserved = RESTRICTED_USERNAMES.has(cleanUsername);

    if (isReserved) {
      if (isGarexcellEmail) {
        return {
          isValid: true,
          isReserved: true,
          isAllowedByEmail: true,
          warning: null,
          message: `Official Garexcell domain (${cleanEmail}) verified. The handle '@${cleanUsername}' is authorized.`
        };
      } else {
        return {
          isValid: false,
          isReserved: true,
          isAllowedByEmail: false,
          warning: `The username '${cleanUsername}' is reserved for official Garexcell staff members. Choose a different handle unless your account uses an official @garexcell.com email address.`,
          message: null
        };
      }
    }

    if (cleanUsername.length < 5) {
      return {
        isValid: false,
        isReserved: false,
        isAllowedByEmail: false,
        warning: 'Username must be at least 5 characters long.',
        message: null
      };
    }

    if (cleanUsername.length > 15) {
      return {
        isValid: false,
        isReserved: false,
        isAllowedByEmail: false,
        warning: 'Username cannot exceed 15 characters.',
        message: null
      };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return {
        isValid: false,
        isReserved: false,
        isAllowedByEmail: false,
        warning: 'Username can only contain letters, numbers, and underscores.',
        message: null
      };
    }

    return {
      isValid: true,
      isReserved: false,
      isAllowedByEmail: false,
      warning: null,
      message: 'Handle is available and valid.'
    };
  }, [username, email]);
}

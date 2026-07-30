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

export function isReservedUsername(username: string, email?: string): boolean {
  if (!username) return false;
  const cleanUsername = username.trim().toLowerCase();
  
  if (RESTRICTED_USERNAMES.has(cleanUsername)) {
    // Allowed ONLY if email ends in @garexcell.com
    if (email && email.trim().toLowerCase().endsWith('@garexcell.com')) {
      return false;
    }
    return true;
  }
  return false;
}

export function sanitizeDatabaseError(errorMsg?: string): string {
  if (!errorMsg) return 'An unexpected error occurred. Please try again.';
  
  const lower = errorMsg.toLowerCase();
  if (lower.includes('duplicate key') || lower.includes('unique constraint') || lower.includes('already exists')) {
    return 'This handle or email is already in use by another account.';
  }
  if (lower.includes('permission denied') || lower.includes('row-level security') || lower.includes('rls')) {
    return 'Access denied. Please check your login credentials and try again.';
  }
  if (lower.includes('foreign key') || lower.includes('violates foreign key')) {
    return 'Action could not be processed. Please refresh and try again.';
  }
  
  // Return generic error without revealing table/column schema
  return 'Unable to save changes. Please try again later.';
}

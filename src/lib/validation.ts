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

export function sanitizeDatabaseError(errorMsg?: string, context?: 'auth' | 'profile' | 'post' | 'message'): string {
  if (!errorMsg) return 'An error occurred. Please try again.';
  
  const lower = errorMsg.toLowerCase();
  
  if (lower.includes('duplicate key') || lower.includes('unique constraint') || lower.includes('already exists') || lower.includes('profiles_username_key')) {
    return 'This username handle is already taken by another gamer. Please pick a different handle.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Incorrect email or password. Please verify your login details.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please check your email inbox to confirm your account before logging in.';
  }
  if (lower.includes('permission denied') || lower.includes('row-level security') || lower.includes('rls') || lower.includes('42501')) {
    return '';
  }
  if (lower.includes('foreign key') || lower.includes('violates foreign key')) {
    return 'Referenced account or content no longer exists. Please refresh.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts in a short time. Please wait a moment and try again.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Network connection issue. Please check your internet connection.';
  }

  if (context === 'auth') {
    return 'Authentication could not be completed. Please check your credentials and try again.';
  }
  if (context === 'profile') {
    return 'Unable to update your profile settings right now. Please try again.';
  }
  if (context === 'post') {
    return 'Your post could not be published at this moment. Please try again.';
  }
  if (context === 'message') {
    return 'Message could not be delivered. Please try sending again.';
  }
  
  return 'The requested action could not be completed. Please try again.';
}

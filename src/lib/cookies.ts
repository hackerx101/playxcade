// Garexcell Shared Cookie Manager for accounts.garexcell.com, play.garexcell.com, id.garexcell.com, pay.garexcell.com

export const COOKIE_NAME = 'garexcell_cookies';

export function setGarexcellCookie(sessionData: { user_id: string; username: string; email: string; token: string }) {
  const value = encodeURIComponent(JSON.stringify(sessionData));
  // Standard cookie assignment with expiration 30 days
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax`;
  localStorage.setItem(COOKIE_NAME, value);
}

export function getGarexcellCookie(): { user_id: string; username: string; email: string; token: string } | null {
  const nameEQ = `${COOKIE_NAME}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        const str = decodeURIComponent(c.substring(nameEQ.length, c.length));
        return JSON.parse(str);
      } catch (e) {
        // Fallback
      }
    }
  }
  
  // Fallback to localStorage
  const localVal = localStorage.getItem(COOKIE_NAME);
  if (localVal) {
    try {
      return JSON.parse(decodeURIComponent(localVal));
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function clearGarexcellCookie() {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  localStorage.removeItem(COOKIE_NAME);
}

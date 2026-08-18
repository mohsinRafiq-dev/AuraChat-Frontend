/**
 * Where the session lives between visits.
 *
 * Two storages, chosen by the "Keep me logged in" checkbox:
 *
 *   localStorage   — survives closing the browser. The default, and what most
 *                    people expect from a messaging app.
 *   sessionStorage — cleared when the tab closes. The right choice on a shared
 *                    or public computer.
 *
 * Reads check both so an existing session keeps working regardless of which
 * storage it landed in, and writes always clear the other one so a session can
 * never exist in both places with different values.
 */

const TOKEN_KEY = 'chat-app-jwt';
const REMEMBER_KEY = 'aurachat-remember-me';
const LAST_CONVERSATION_KEY = 'aurachat-last-conversation';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/** Did the user ask to stay signed in? Defaults to true for existing sessions. */
export function getRememberPreference() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

export function storeToken(token, remember = getRememberPreference()) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Private browsing can throw on write; the in-memory session still works
    // for this tab, it just will not survive a reload.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_CONVERSATION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Reads the JWT's expiry without verifying it — the server is the only thing
 * that can actually validate a token. This is purely so the client can avoid
 * booting into a session it already knows is dead, and decide when to refresh.
 */
export function readTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const exp = readTokenExpiry(token);
  return exp !== null && exp <= Date.now();
}

/** True once the token is past halfway to expiry — time to ask for a fresh one. */
export function shouldRefreshToken(token) {
  const exp = readTokenExpiry(token);
  if (exp === null) return false;
  const lifetimeMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() > exp - lifetimeMs / 2;
}

/** The conversation to reopen on the next visit. */
export function getLastConversationId() {
  try {
    return localStorage.getItem(LAST_CONVERSATION_KEY) || null;
  } catch {
    return null;
  }
}

export function setLastConversationId(id) {
  try {
    if (id) localStorage.setItem(LAST_CONVERSATION_KEY, String(id));
    else localStorage.removeItem(LAST_CONVERSATION_KEY);
  } catch {
    /* ignore */
  }
}

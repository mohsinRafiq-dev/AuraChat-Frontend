import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { skipAuth } from '../config/flags.js';
import {
  getStoredToken,
  getRememberPreference,
  storeToken,
  clearSession,
  isTokenExpired,
  shouldRefreshToken
} from '../services/session.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'chat-app-jwt';
/** Placeholder so `authenticated` and socket `auth` stay truthy while REST stays unauthenticated. */
const SKIP_TOKEN = 'skip-auth-build';

function describeProfileFailure(error) {
  const status = error?.response?.status;
  const body = error?.response?.data?.error || error?.response?.data?.message;
  if (status === 401) {
    return 'The API returned 401 Unauthorized. The dev UI calls /api/auth/profile without a Bearer token, so the server must run with skip-auth enabled (in development it is now ON by default). If you set SKIP_AUTH=false in backend .env, set it back or use real login.';
  }
  if (status) {
    return `The API returned HTTP ${status}${body ? `: ${body}` : ''}. Check the backend terminal for stack traces.`;
  }
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'Network error: the browser could not complete the request. If the API is up, try the same host for the app and API (e.g. both localhost), and confirm Vite is proxying /api to port 4000.';
  }
  return error?.message || 'Unknown error loading profile.';
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (skipAuth) return SKIP_TOKEN;
    const stored = getStoredToken();
    // Booting with a token we can already see is expired means a guaranteed
    // 401 and a flash of the app before being kicked to the login screen.
    if (stored && isTokenExpired(stored)) {
      clearSession();
      return null;
    }
    return stored;
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skipBoot, setSkipBoot] = useState(0);
  const [skipProfileError, setSkipProfileError] = useState(null);
  /** When true (skip-auth only), dev profile is not auto-loaded until `resumeSkipDevSession`. */
  const [skipDevPaused, setSkipDevPaused] = useState(false);

  const resumeSkipDevSession = useCallback(() => {
    setSkipDevPaused(false);
    setSkipBoot((n) => n + 1);
  }, []);

  const logout = useCallback(() => {
    if (skipAuth) {
      api.setToken(null);
      setUser(null);
      setToken(SKIP_TOKEN);
      setSkipDevPaused(true);
      setLoading(false);
      return;
    }
    setSkipDevPaused(false);
    localStorage.removeItem(STORAGE_KEY);
    api.setToken(null);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      if (skipAuth) return;
      logout();
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (!skipAuth) return undefined;
    if (skipDevPaused) {
      return undefined;
    }

    let cancelled = false;

    const loadDevProfile = async () => {
      setLoading(true);
      setSkipProfileError(null);
      try {
        api.setToken(null);
        const response = await api.get('/api/auth/profile');
        if (!cancelled) {
          setUser(response.data.user);
          setToken(SKIP_TOKEN);
          setSkipProfileError(null);
        }
      } catch (error) {
        const detail = describeProfileFailure(error);
        console.error('Dev profile failed:', detail, error);
        if (!cancelled) {
          setUser(null);
          setSkipProfileError(detail);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDevProfile();

    return () => {
      cancelled = true;
    };
  }, [skipAuth, skipBoot, skipDevPaused]);

  useEffect(() => {
    if (skipAuth) return undefined;
    if (!token) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      try {
        api.setToken(token);
        const response = await api.get('/api/auth/profile');
        if (!cancelled) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Auth profile failed', error);
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [token, logout, skipAuth]);

  const persistSession = useCallback((newToken, profile, remember) => {
    setSkipDevPaused(false);
    // `remember` decides localStorage (survives closing the browser) vs
    // sessionStorage (gone with the tab). Undefined keeps the existing choice,
    // which is what a token refresh wants.
    storeToken(newToken, remember);
    api.setToken(newToken);
    setToken(newToken);
    if (profile) setUser(profile);
  }, []);

  /**
   * Keeps the session alive.
   *
   * Tokens are signed for a fixed 7 days with no way to extend them, so a user
   * who came back on day eight was logged out with no warning. Swapping a
   * still-valid token for a fresh one turns that into a sliding window: normal
   * use never expires, a long absence still does.
   *
   * Runs on boot, hourly while the app is open, and whenever the tab regains
   * focus — a laptop that slept for two days wakes up and renews immediately
   * rather than waiting for the next interval.
   */
  useEffect(() => {
    if (skipAuth || !token || !user) return undefined;

    let cancelled = false;

    const renew = async () => {
      if (cancelled || !shouldRefreshToken(token)) return;
      try {
        const response = await api.post('/api/auth/refresh');
        if (!cancelled && response.data?.token) {
          // No `remember` argument: keep whatever storage the user chose.
          persistSession(response.data.token, response.data.user);
        }
      } catch {
        // A failure here is not fatal — the current token is still valid until
        // it expires, and the 401 interceptor handles it if it does.
      }
    };

    renew();
    const interval = setInterval(renew, 60 * 60 * 1000);
    const onFocus = () => renew();
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [token, user, persistSession]);

  const login = useCallback(
    async ({ email, password, remember = true }) => {
      const response = await api.post('/api/auth/login', { email, password });
      persistSession(response.data.token, response.data.user, remember);
      return response.data.user;
    },
    [persistSession]
  );

  const loginWithGoogle = useCallback(
    async (credential, remember = true) => {
      const response = await api.post('/api/auth/google', { credential });
      persistSession(response.data.token, response.data.user, remember);
      return response.data.user;
    },
    [persistSession]
  );

  const register = useCallback(
    async ({ email, password, username, remember = true }) => {
      const response = await api.post('/api/auth/register', { email, password, username });
      persistSession(response.data.token, response.data.user, remember);
      return response.data.user;
    },
    [persistSession]
  );

  const updateUserProfile = useCallback(async (updates) => {
    const response = await api.patch('/api/auth/profile', updates);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      loginWithGoogle,
      register,
      logout,
      updateUserProfile,
      loading,
      skipAuth,
      skipProfileError,
      skipDevPaused,
      resumeSkipDevSession,
      authenticated: skipAuth ? Boolean(user) : Boolean(user && token)
    }),
    [
      token,
      user,
      login,
      loginWithGoogle,
      register,
      logout,
      updateUserProfile,
      loading,
      skipProfileError,
      skipDevPaused,
      resumeSkipDevSession
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

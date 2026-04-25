import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext.jsx';
import { skipAuth } from '../config/flags.js';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage({ onBackToHome, onGoToRegister }) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Sign-in failed. Check your credentials.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Decorative side */}
      <div className="auth-page__brand-side">
        <div className="auth-page__brand-inner">
          <div className="auth-page__brand-orb auth-page__brand-orb--1" />
          <div className="auth-page__brand-orb auth-page__brand-orb--2" />
          <div className="auth-page__brand-logo">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2 className="auth-page__brand-title">Aura Chat</h2>
          <p className="auth-page__brand-tagline">Fast, secure, real-time messaging with delivery receipts and presence.</p>
          <div className="auth-page__brand-stats">
            <div className="auth-page__stat">
              <span className="auth-page__stat-value">∞</span>
              <span className="auth-page__stat-label">Messages</span>
            </div>
            <div className="auth-page__stat">
              <span className="auth-page__stat-value">&lt;50ms</span>
              <span className="auth-page__stat-label">Latency</span>
            </div>
            <div className="auth-page__stat">
              <span className="auth-page__stat-value">E2E</span>
              <span className="auth-page__stat-label">Encryption</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="auth-page__form-side">
        <div className="auth-panel">
          {onBackToHome ? (
            <button type="button" className="auth-backlink" onClick={onBackToHome}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to home
            </button>
          ) : null}
          <header className="auth-panel__header">
            <h1>Welcome back</h1>
            <p className="auth-panel__lede">Sign in to your account to continue chatting.</p>
          </header>
          <form className="auth-form" onSubmit={onSubmit}>
            <label className="field">
              <span className="sr-only">Email</span>
              <div className="field__input-wrap">
                <svg className="field__icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  className="field__input"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>
            <label className="field">
              <span className="sr-only">Password</span>
              <div className="field__input-wrap">
                <svg className="field__icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  className="field__input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="btn btn--primary btn--block" type="submit" disabled={submitting}>
              {submitting ? (
                <span className="btn__spinner" />
              ) : null}
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {!skipAuth && googleClientId ? (
            <>
              <p className="auth-divider">
                <span>or</span>
              </p>
              <div className="auth-google">
                <GoogleLogin
                  onSuccess={async (res) => {
                    if (!res.credential) return;
                    setError(null);
                    setSubmitting(true);
                    try {
                      await loginWithGoogle(res.credential);
                    } catch (err) {
                      const message =
                        err?.response?.data?.error ||
                        err?.response?.data?.message ||
                        err?.message ||
                        'Google sign-in failed.';
                      setError(message);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  onError={() => setError('Google sign-in was dismissed or failed.')}
                  useOneTap={false}
                  theme="filled_blue"
                  size="large"
                  width={384}
                  text="continue_with"
                  shape="rectangular"
                />
              </div>
            </>
          ) : null}

          {onGoToRegister ? (
            <p className="auth-panel__footer">
              Don't have an account?{' '}
              <button type="button" className="auth-linkbtn" onClick={onGoToRegister}>
                Create one for free
              </button>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

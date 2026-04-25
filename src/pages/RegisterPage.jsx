import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function RegisterPage({ onBackToHome, onGoToLogin }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        username: username.trim() || undefined
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed.';
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
          <p className="auth-page__brand-tagline">Join thousands of people chatting in real-time with instant delivery and read receipts.</p>
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
            <h1>Create account</h1>
            <p className="auth-panel__lede">Start chatting in seconds. It's free.</p>
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
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>
            <label className="field">
              <span className="sr-only">Username (optional)</span>
              <div className="field__input-wrap">
                <svg className="field__icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  className="field__input"
                  type="text"
                  autoComplete="nickname"
                  placeholder="Pick a display name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={64}
                />
              </div>
            </label>
            <label className="field">
              <span className="sr-only">Password (min 8 characters)</span>
              <div className="field__input-wrap">
                <svg className="field__icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  className="field__input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="btn btn--primary btn--block" type="submit" disabled={submitting}>
              {submitting ? <span className="btn__spinner" /> : null}
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          {onGoToLogin ? (
            <p className="auth-panel__footer">
              Already have an account?{' '}
              <button type="button" className="auth-linkbtn" onClick={onGoToLogin}>
                Sign in instead
              </button>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

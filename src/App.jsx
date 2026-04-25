import { useEffect, useRef, useState } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { ChatProvider } from './contexts/ChatContext.jsx';
import ChatPage from './pages/ChatPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

export default function App() {
  const { loading, authenticated, skipAuth, skipProfileError, skipDevPaused, resumeSkipDevSession } = useAuth();
  const [authMode, setAuthMode] = useState('landing');
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (wasAuthenticated.current && !authenticated && !skipAuth) {
      setAuthMode('landing');
    }
    wasAuthenticated.current = authenticated;
  }, [authenticated, skipAuth]);

  if (loading) {
    return (
      <div className="app-boot">
        <div className="app-boot__card app-boot__card--row" role="status">
          <span className="app-boot__dot" />
          <p>{skipAuth ? 'Loading…' : 'Restoring session…'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {authenticated ? (
        <ChatProvider>
          <ChatPage />
        </ChatProvider>
      ) : skipAuth && skipDevPaused ? (
        <div className="app-boot">
          <div className="app-boot__card" role="status">
            <p className="app-boot__lede-text">Dev session is off (you used Log out while skip-auth is enabled).</p>
            <button type="button" className="btn btn--primary" onClick={resumeSkipDevSession}>
              Resume dev session
            </button>
          </div>
        </div>
      ) : skipAuth ? (
        <div className="app-boot">
          <div className="app-boot__card" role="alert">
            <p>Could not load the dev profile.</p>
            {skipProfileError ? (
              <p className="app-boot__detail">{skipProfileError}</p>
            ) : (
              <p className="app-boot__hint">
                Start MongoDB, run <code>npm run dev</code> in <code>backend</code> (port 4000), and keep the
                frontend on Vite so <code>/api</code> is proxied. In development, skip-auth is on by default unless
                you set <code>SKIP_AUTH=false</code>.
              </p>
            )}
          </div>
        </div>
      ) : authMode === 'login' ? (
        <LoginPage
          onBackToHome={() => setAuthMode('landing')}
          onGoToRegister={() => setAuthMode('register')}
        />
      ) : authMode === 'register' ? (
        <RegisterPage
          onBackToHome={() => setAuthMode('landing')}
          onGoToLogin={() => setAuthMode('login')}
        />
      ) : (
        <LandingPage
          onStartChat={() => setAuthMode('login')}
          onCreateAccount={() => setAuthMode('register')}
        />
      )}
    </div>
  );
}

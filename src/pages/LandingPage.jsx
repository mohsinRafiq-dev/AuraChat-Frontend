import { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext.jsx';

function FloatingOrbs() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const orbs = [
      { x: 0.2, y: 0.3, r: 260, color: 'rgba(59,130,246,0.12)', dx: 0.0003, dy: 0.0002 },
      { x: 0.8, y: 0.6, r: 200, color: 'rgba(139,92,246,0.10)', dx: -0.0002, dy: 0.0003 },
      { x: 0.5, y: 0.8, r: 180, color: 'rgba(16,185,129,0.08)', dx: 0.0004, dy: -0.0001 },
    ];

    function resize() {
      // Measure the CSS box, not offsetWidth. Without a CSS size, offsetWidth
      // is derived from the width attribute this function sets, so each call
      // multiplied the canvas by devicePixelRatio again — 300 to 600 to 1200
      // on a 2x phone, which dragged the whole page wider than the viewport.
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * devicePixelRatio));
      canvas.height = Math.max(1, Math.round(rect.height * devicePixelRatio));
      // setTransform, not scale: scale compounds on every resize.
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      orbs.forEach((o) => {
        o.x += o.dx;
        o.y += o.dy;
        if (o.x < 0 || o.x > 1) o.dx *= -1;
        if (o.y < 0 || o.y > 1) o.dy *= -1;
        const grad = ctx.createRadialGradient(o.x * w, o.y * h, 0, o.x * w, o.y * h, o.r);
        grad.addColorStop(0, o.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x * w, o.y * h, o.r, 0, Math.PI * 2);
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="landing-orbs" aria-hidden />;
}

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Real-time Chat',
    desc: 'Messages delivered instantly via WebSockets with zero lag.',
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    title: 'Read Receipts',
    desc: 'WhatsApp-style ticks — sent, delivered, and read.',
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: 'Online Presence',
    desc: "See who's online right now with live indicators.",
  },
];

export default function LandingPage({ onStartChat, onCreateAccount }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing">
      <FloatingOrbs />
      <div className="landing__content">
        <div className="landing__hero" style={{ animationDelay: '0s' }}>
          <span className="landing__badge">✦ Real-time messaging</span>
          <h1 className="landing__title">
            Connect instantly.<br />
            <span className="landing__title-accent">Chat beautifully.</span>
          </h1>
          <p className="landing__lede">
            A modern messaging experience with real-time delivery, read receipts,
            and online presence — built for speed and elegance.
          </p>
          <div className="landing__actions">
            <button type="button" className="btn btn--primary btn--lg btn--glow" onClick={onStartChat}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Get started
            </button>
            <button type="button" className="btn btn--ghost btn--lg" onClick={onCreateAccount}>
              Create account
            </button>
            <button type="button" className="btn btn--icon btn--ghost" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="landing__features">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i} style={{ animationDelay: `${0.15 + i * 0.1}s` }}>
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="landing__footer">
          Built with React · Socket.io · MongoDB
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import {
  Command, Code2, Sparkles, Check,
  ChevronRight, ChevronLeft, Eye, EyeOff, ExternalLink,
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const STORAGE_KEY   = 'mc_onboarding_complete';
const USER_TYPE_KEY = 'mc_user_type';  // 'explorer' | 'developer'
const USER_MODE_KEY = 'mc_user_mode';  // 'creator'  | 'dev'

/* ─── SVG brand icons ────────────────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

/* ─── Shared primitives ──────────────────────────────────────────────────── */

function Screen({ children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A]">
      <div
        className="w-full max-w-[480px] mx-auto px-6 py-8"
        style={{ boxShadow: '0 0 60px rgba(6,182,212,0.05)' }}
      >
        {children}
      </div>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 cursor-pointer border-none bg-transparent select-none mb-6 transition-colors"
      style={{ color: '#6B7280', fontSize: 13, fontFamily: 'inherit', padding: 0, minHeight: 44 }}
      onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
      onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
    >
      <ChevronLeft size={15} strokeWidth={2} />
      Back
    </button>
  );
}

function CyanBtn({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-[#0A0A0A] font-semibold rounded-lg cursor-pointer border-none transition-all select-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#0891B2]'
      }`}
      style={{ background: '#06B6D4', padding: '14px', fontSize: 15, fontFamily: 'inherit', minHeight: 44 }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg cursor-pointer select-none transition-colors"
      style={{
        background: 'transparent', border: '1px solid #2A2A2A',
        color: '#9CA3AF', padding: '12px 20px', fontFamily: 'inherit',
        fontSize: 14, fontWeight: 500, minHeight: 44,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#3A3A3A')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
    >
      {children}
    </button>
  );
}

function OAuthBtn({ icon, label, onClick, recommended = false, glow = false }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer select-none rounded-lg transition-all w-full"
      style={{
        background: '#111111',
        border: glow ? '1px solid rgba(6,182,212,0.4)' : '1px solid #2A2A2A',
        boxShadow: glow ? '0 0 12px rgba(6,182,212,0.08)' : 'none',
        color: '#F9FAFB', padding: '12px 16px',
        fontSize: 14, fontFamily: 'inherit', minHeight: 44, fontWeight: 500,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = glow ? 'rgba(6,182,212,0.7)' : '#3A3A3A';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = glow ? 'rgba(6,182,212,0.4)' : '#2A2A2A';
      }}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {recommended && (
        <span
          className="rounded text-[10px] font-medium shrink-0"
          style={{
            background: 'rgba(6,182,212,0.12)',
            border: '1px solid rgba(6,182,212,0.3)',
            color: '#06B6D4', padding: '2px 7px',
          }}
        >
          For developers
        </span>
      )}
    </button>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-[13px] text-white pointer-events-none"
      style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', zIndex: 100, whiteSpace: 'nowrap' }}
    >
      {message}
    </div>
  );
}

function ProgressDots({ current, total = 4 }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 8 : 6,
            height: i === current ? 8 : 6,
            borderRadius: '50%',
            background: i === current ? '#06B6D4' : '#2A2A2A',
            transition: 'all 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Slide transition wrapper ───────────────────────────────────────────── */

function SlideTransition({ screenIndex, direction, children }) {
  const [displayed, setDisplayed] = useState(children);
  const [animating, setAnimating] = useState(false);
  const [slideOut, setSlideOut] = useState(false);
  const prevIndex = useRef(screenIndex);
  const pendingChildren = useRef(null);
  const currentDirection = useRef(direction);

  useEffect(() => {
    if (screenIndex === prevIndex.current) return;

    currentDirection.current = direction;
    pendingChildren.current = children;
    setAnimating(true);
    setSlideOut(true);

    const t = setTimeout(() => {
      setDisplayed(pendingChildren.current);
      setSlideOut(false);
      prevIndex.current = screenIndex;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(false));
      });
    }, 250);

    return () => clearTimeout(t);
  }, [screenIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const isBack = currentDirection.current === 'back';
  const exitX = isBack ? '40px' : '-40px';
  const enterX = isBack ? '-40px' : '40px';

  return (
    <div style={{ overflow: 'hidden', minHeight: '100vh' }}>
      <div
        style={{
          transition: 'transform 250ms ease-in-out, opacity 250ms ease-in-out',
          transform: animating
            ? slideOut ? `translateX(${exitX})` : `translateX(${enterX})`
            : 'translateX(0)',
          opacity: animating ? 0 : 1,
        }}
      >
        {displayed}
      </div>
    </div>
  );
}

/* ─── Screen 1: Splash ───────────────────────────────────────────────────── */

function SplashScreen({ onNext }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#0A0A0A]">
      <div className="w-full h-1 shrink-0 bg-[#F97316]" />

      <div
        className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-[320px] mx-auto"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <div
          className="flex items-center justify-center rounded-2xl mb-6"
          style={{ width: 80, height: 80, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}
        >
          <Command size={40} color="#06B6D4" strokeWidth={1.5} />
        </div>

        <h1
          className="text-white text-center m-0 mb-2"
          style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.5px' }}
        >
          Mission Control
        </h1>

        <p className="text-center m-0 mb-1" style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>
          Your AI. Your tasks.
        </p>
        <p className="text-center m-0 mb-12" style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6 }}>
          Running while you sleep.
        </p>

        <div className="w-full">
          <button
            onClick={onNext}
            className="w-full text-[#0A0A0A] font-semibold rounded-lg border-none cursor-pointer select-none"
            style={{
              background: '#06B6D4',
              padding: '14px',
              fontSize: 15,
              fontFamily: 'inherit',
              minHeight: 44,
              animation: 'pulse-glow 2.5s ease-in-out infinite',
            }}
          >
            Get Started
          </button>
        </div>

        <p className="text-center mt-5 mb-0 text-[13px]" style={{ color: '#4B5563' }}>
          Already have an account?{' '}
          <span
            className="cursor-pointer transition-colors"
            style={{ color: '#6B7280' }}
            onClick={onNext}
            onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
          >
            Sign in
          </span>
        </p>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.5); }
          50%       { box-shadow: 0 0 0 10px rgba(6,182,212,0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Screen 2: Sign In ──────────────────────────────────────────────────── */

function SignInScreen({ onNext, onBack, onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function handleSignIn() {
    if (email === 'test' && password === 'test') {
      setError('');
      localStorage.setItem(STORAGE_KEY, 'true');
      onSignedIn();
    } else {
      setError('Invalid credentials. Try test / test.');
    }
  }

  return (
    <Screen>
      <BackBtn onClick={onBack} />

      <p
        className="text-center m-0 mb-6"
        style={{ color: '#6B7280', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}
      >
        Mission Control
      </p>

      <h2
        className="text-white m-0 mb-1"
        style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.3px' }}
      >
        Welcome.
      </h2>
      <p className="m-0 mb-8" style={{ color: '#9CA3AF', fontSize: 14 }}>
        Sign in to continue.
      </p>

      <div className="flex flex-col" style={{ gap: 10, marginBottom: 24 }}>
        <OAuthBtn
          icon={<GitHubIcon />}
          label="Continue with GitHub"
          recommended
          glow
          onClick={() => showToast('GitHub sign-in coming soon')}
        />
        <OAuthBtn
          icon={<GoogleIcon />}
          label="Continue with Google"
          onClick={() => showToast('Google sign-in coming soon')}
        />
        <OAuthBtn
          icon={<AppleIcon />}
          label="Continue with Apple"
          onClick={() => showToast('Apple sign-in coming soon')}
        />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ background: '#1F1F1F' }} />
        <span style={{ color: '#6B7280', fontSize: 12 }}>or</span>
        <div className="flex-1 h-px" style={{ background: '#1F1F1F' }} />
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSignIn()}
          className="w-full rounded-lg outline-none"
          style={{
            background: '#111111', border: '1px solid #2A2A2A',
            padding: '12px', fontFamily: 'inherit', minHeight: 44, color: '#F9FAFB', fontSize: 14,
          }}
          onFocus={e => (e.target.style.borderColor = '#06B6D4')}
          onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
        />
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSignIn()}
            className="w-full rounded-lg outline-none"
            style={{
              background: '#111111', border: '1px solid #2A2A2A',
              padding: '12px 44px 12px 12px', fontFamily: 'inherit',
              minHeight: 44, color: '#F9FAFB', fontSize: 14,
            }}
            onFocus={e => (e.target.style.borderColor = '#06B6D4')}
            onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
          />
          <button
            onClick={() => setShowPass(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
            style={{ color: '#4B5563' }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <CyanBtn onClick={handleSignIn}>Sign In</CyanBtn>

      {error && (
        <p className="m-0 mt-3 text-center text-[13px]" style={{ color: '#EF4444' }}>
          {error}
        </p>
      )}

      <Toast message={toast} />
    </Screen>
  );
}

/* ─── Screen 3: Connect Key ──────────────────────────────────────────────── */

const ENGINE_OPTIONS = [
  { id: 'claude-code', label: 'Claude Code', badge: 'Default' },
  { id: 'cursor',      label: 'Cursor',       badge: null },
  { id: 'more',        label: 'More soon',    badge: null, disabled: true },
];

const ENGINE_CONFIG = {
  'claude-code': {
    placeholder: 'sk-ant-...',
    link: 'https://console.anthropic.com',
    linkText: 'Get your Anthropic key',
  },
  'cursor': {
    placeholder: 'sk-...',
    link: 'https://platform.openai.com/api-keys',
    linkText: 'Get your OpenAI key',
  },
};

function KeyInput({ value, onChange, onHoverIn, onHoverOut, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={onHoverIn} onMouseLeave={onHoverOut}>
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg outline-none"
        style={{
          background: '#0A0A0A',
          border: '1px solid #2A2A2A',
          padding: '12px 44px 12px 12px',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#F9FAFB',
          fontSize: 13,
          minHeight: 44,
        }}
        onFocus={e => (e.target.style.borderColor = '#06B6D4')}
        onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
      />
      <button
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
        style={{ color: '#4B5563' }}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function EngineSelector({ selected, onChange }) {
  return (
    <div className="flex gap-2 mb-5">
      {ENGINE_OPTIONS.map(opt => {
        const isSelected = selected === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => !opt.disabled && onChange(opt.id)}
            disabled={opt.disabled}
            className="flex-1 rounded-lg text-left border-none transition-all select-none"
            style={{
              background: isSelected ? 'rgba(6,182,212,0.08)' : '#111111',
              border: isSelected ? '1px solid rgba(6,182,212,0.4)' : '1px solid #2A2A2A',
              padding: '10px 12px',
              fontFamily: 'inherit',
              opacity: opt.disabled ? 0.4 : 1,
              cursor: opt.disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <p className="m-0 text-white" style={{ fontSize: 12, fontWeight: 600 }}>
              {opt.label}
            </p>
            {opt.badge && (
              <p className="m-0 mt-0.5" style={{ color: '#06B6D4', fontSize: 10 }}>
                {opt.badge}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

const STEP_CARDS = [
  { num: '01', title: 'Open the console', body: 'Go to console.anthropic.com and sign in or create a free account.' },
  { num: '02', title: 'Copy your key', body: 'Under API Keys, create a new key and copy it to your clipboard.' },
  { num: '03', title: 'Paste it below', body: 'Paste your key in the field below. We encrypt it and never share it.' },
];

function ConnectKeyScreen({ onNext, onBack, onDetectType }) {
  const [engine, setEngine] = useState('claude-code');
  const [key, setKey]       = useState('');
  const [showExplainers, setShowExplainers] = useState(false);

  const appearedAt   = useRef(Date.now());
  const hasTypedRef  = useRef(false);
  const hoverTimer   = useRef(null);

  function handleKeyChange(val) {
    setKey(val);
    if (val && !hasTypedRef.current) {
      hasTypedRef.current = true;
      if (Date.now() - appearedAt.current < 3000) {
        setShowExplainers(false);
        onDetectType('developer');
      }
    }
  }

  function handleHoverIn() {
    if (hasTypedRef.current) return;
    hoverTimer.current = setTimeout(() => {
      setShowExplainers(true);
      onDetectType('explorer');
    }, 3000);
  }

  function handleHoverOut() {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  const cfg = ENGINE_CONFIG[engine] || ENGINE_CONFIG['claude-code'];

  return (
    <Screen>
      <BackBtn onClick={onBack} />

      <h2
        className="text-white m-0 mb-2"
        style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px' }}
      >
        Connect your AI key.
      </h2>
      <p className="m-0 mb-6" style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6 }}>
        You pay your provider directly. We never touch your billing.
      </p>

      <EngineSelector selected={engine} onChange={setEngine} />

      {showExplainers && (
        <div className="flex flex-col gap-3 mb-5">
          {STEP_CARDS.map(({ num, title, body }) => (
            <div
              key={num}
              className="rounded-xl p-4"
              style={{ background: '#111111', border: '1px solid #2A2A2A' }}
            >
              <p className="m-0 mb-1" style={{ color: '#06B6D4', fontSize: 20, fontWeight: 700 }}>{num}</p>
              <p className="m-0 mb-1 text-white" style={{ fontSize: 13, fontWeight: 600 }}>{title}</p>
              <p className="m-0" style={{ color: '#9CA3AF', fontSize: 12, lineHeight: 1.5 }}>{body}</p>
            </div>
          ))}
        </div>
      )}

      <KeyInput
        value={key}
        onChange={handleKeyChange}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        placeholder={cfg.placeholder}
      />

      <a
        href={cfg.link}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 mt-2 mb-6 no-underline"
        style={{ color: '#06B6D4', fontSize: 11 }}
      >
        {cfg.linkText} <ExternalLink size={10} />
      </a>

      <div className="flex flex-col gap-3">
        <CyanBtn onClick={() => onNext({ key, engine })} disabled={!key.trim()}>
          Continue
        </CyanBtn>
        <GhostBtn onClick={() => onNext()}>Skip for now</GhostBtn>
      </div>
    </Screen>
  );
}

/* ─── Screen 4: Mode Selection ───────────────────────────────────────────── */

const MODES = [
  {
    id: 'creator',
    Icon: Sparkles,
    title: 'Creator Mode',
    explorerDesc: 'Ideas, content, research, business plans — done while you sleep.',
    developerDesc: 'Non-technical output: content strategy, market research, brand assets.',
  },
  {
    id: 'dev',
    Icon: Code2,
    title: 'Dev Mode',
    explorerDesc: 'Ship features and experiments without writing a single line of code.',
    developerDesc: 'Submit feature requests. AI builds, branches, and ships code autonomously.',
  },
];

function ModeScreen({ onNext, onBack, userType }) {
  const [selected, setSelected] = useState(null);

  return (
    <Screen>
      <BackBtn onClick={onBack} />

      <h2
        className="text-white m-0 mb-2"
        style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px' }}
      >
        How will you use Mission Control?
      </h2>
      <p className="m-0 mb-8" style={{ color: '#9CA3AF', fontSize: 13 }}>
        You can switch this anytime in settings.
      </p>

      <div className="flex flex-col gap-4 mb-8">
        {MODES.map(({ id, Icon, title, explorerDesc, developerDesc }) => {
          const isSelected = selected === id;
          const desc = userType === 'developer' ? developerDesc : explorerDesc;
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className="text-left rounded-xl cursor-pointer border-none transition-all select-none w-full"
              style={{
                background: '#111111',
                border: isSelected ? '2px solid #06B6D4' : '1px solid #2A2A2A',
                boxShadow: isSelected ? '0 0 0 3px rgba(6,182,212,0.1)' : 'none',
                fontFamily: 'inherit',
                padding: isSelected ? '19px' : '20px',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#06B6D4'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#2A2A2A'; }}
            >
              <div className="mb-4">
                <Icon size={32} color="#06B6D4" strokeWidth={1.5} />
              </div>
              <p className="m-0 mb-1.5 text-white" style={{ fontSize: 16, fontWeight: 600 }}>
                {title}
              </p>
              <p className="m-0" style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.5 }}>
                {desc}
              </p>
            </button>
          );
        })}
      </div>

      <CyanBtn onClick={() => onNext({ mode: selected })} disabled={!selected}>
        Continue
      </CyanBtn>
    </Screen>
  );
}

/* ─── Screen 5: How It Works ─────────────────────────────────────────────── */

const HOW_IT_WORKS = {
  explorer: [
    { num: '01', title: 'Describe your idea', body: 'Type what you want in plain English — no jargon, no setup.' },
    { num: '02', title: 'We handle the rest', body: 'Mission Control assigns AI and runs it autonomously in the background.' },
    { num: '03', title: 'Come back to results', body: 'Your content, research, or plan is ready — in the app or in your email.' },
  ],
  developer: [
    { num: '01', title: 'Submit a task', body: 'Write a feature request, bug fix, or experiment in plain text.' },
    { num: '02', title: 'AI takes the wheel', body: 'Claude Code picks it up, branches, and starts building autonomously.' },
    { num: '03', title: 'Review and ship', body: 'A PR lands in your repo. Approve, tweak, or merge — you decide.' },
  ],
};

function HowItWorksScreen({ onNext, onBack, userType }) {
  const steps = HOW_IT_WORKS[userType] || HOW_IT_WORKS.explorer;

  return (
    <Screen>
      <BackBtn onClick={onBack} />

      <h2
        className="text-white m-0 mb-2"
        style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px' }}
      >
        Here&apos;s how it works.
      </h2>
      <p className="m-0 mb-8" style={{ color: '#9CA3AF', fontSize: 13 }}>
        Three steps. Zero friction.
      </p>

      <div className="flex flex-col gap-4 mb-8">
        {steps.map(({ num, title, body }) => (
          <div
            key={num}
            className="rounded-xl p-5"
            style={{ background: '#111111', border: '1px solid #2A2A2A' }}
          >
            <p
              className="m-0 mb-3"
              style={{ color: '#06B6D4', fontSize: 28, fontWeight: 700, lineHeight: 1 }}
            >
              {num}
            </p>
            <p className="m-0 mb-1.5 text-white" style={{ fontSize: 15, fontWeight: 600 }}>
              {title}
            </p>
            <p className="m-0" style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.5 }}>
              {body}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-lg border-none cursor-pointer select-none flex items-center justify-center gap-2 transition-colors"
        style={{
          background: '#06B6D4', color: '#0A0A0A',
          padding: '14px', fontSize: 15, fontWeight: 700,
          fontFamily: 'inherit', minHeight: 44,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#0891B2')}
        onMouseLeave={e => (e.currentTarget.style.background = '#06B6D4')}
      >
        Let&apos;s go <ChevronRight size={18} />
      </button>
    </Screen>
  );
}

/* ─── Screen 6: Done (auto-advance) ─────────────────────────────────────── */

const DONE_COPY = {
  explorer: {
    heading: "You're all set.",
    sub: 'Your AI team is ready. Drop your first idea in the queue.',
  },
  developer: {
    heading: 'Ready to ship.',
    sub: 'Push your first task. Mission Control will handle the rest.',
  },
};

function DoneScreen({ onComplete, userType }) {
  const [phase, setPhase] = useState(0);
  const { heading, sub } = DONE_COPY[userType] || DONE_COPY.explorer;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, 'true');
      onComplete();
    }, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A]">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: phase >= 1 ? 'scale(1)' : 'scale(0.6)',
            opacity: phase >= 1 ? 1 : 0,
            transition: 'transform 0.45s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.3s ease',
          }}
        >
          <Check size={36} color="#06B6D4" strokeWidth={2.5} />
        </div>

        <div
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s',
          }}
        >
          <h2 className="text-white m-0 mb-2" style={{ fontSize: 28, fontWeight: 600 }}>
            {heading}
          </h2>
          <p className="m-0" style={{ color: '#9CA3AF', fontSize: 14 }}>
            {sub}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Root OnboardingFlow ────────────────────────────────────────────────── */

export default function OnboardingFlow({ onComplete }) {
  const [screenIndex, setScreenIndex] = useState(0);
  const [direction,   setDirection]   = useState('forward');
  const [userType,    setUserType]    = useState(null); // 'explorer' | 'developer'

  function detectType(type) {
    setUserType(type);
    localStorage.setItem(USER_TYPE_KEY, type);
  }

  function advance(data = {}) {
    if (data?.mode) localStorage.setItem(USER_MODE_KEY, data.mode);
    setDirection('forward');
    setScreenIndex(i => i + 1);
  }

  function goBack() {
    setDirection('back');
    setScreenIndex(i => Math.max(0, i - 1));
  }

  const showDots = screenIndex >= 1 && screenIndex <= 4;

  const screen = (() => {
    switch (screenIndex) {
      case 0: return <SplashScreen onNext={() => advance()} />;
      case 1: return <SignInScreen onNext={() => advance()} onBack={goBack} onSignedIn={onComplete} />;
      case 2: return <ConnectKeyScreen onNext={data => advance(data)} onBack={goBack} onDetectType={detectType} />;
      case 3: return <ModeScreen onNext={data => advance(data)} onBack={goBack} userType={userType} />;
      case 4: return <HowItWorksScreen onNext={() => advance()} onBack={goBack} userType={userType} />;
      case 5: return <DoneScreen onComplete={onComplete} userType={userType} />;
      default: return null;
    }
  })();

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {showDots && (
        <>
          <div className="hidden md:block fixed top-0 left-0 right-0 z-50">
            <ProgressDots current={screenIndex - 1} total={4} />
          </div>
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <ProgressDots current={screenIndex - 1} total={4} />
          </div>
        </>
      )}
      <SlideTransition screenIndex={screenIndex} direction={direction}>
        {screen}
      </SlideTransition>
    </div>
  );
}

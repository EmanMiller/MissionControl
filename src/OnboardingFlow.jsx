import { useState, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Command, Apple, Github, Code2, Sparkles, Check,
  ChevronRight, ChevronLeft, Eye, EyeOff, Loader,
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'mc_onboarding_complete';

/* ─── Shared primitives ──────────────────────────────────────────────────── */

// Centered max-480px card on desktop, full-screen on mobile
function Card({ children, className = '' }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A]">
      <div
        className={`w-full max-w-[480px] mx-auto px-6 py-8 ${className}`}
        style={{ boxShadow: '0 0 60px rgba(6,182,212,0.05)' }}
      >
        {children}
      </div>
    </div>
  );
}

// Subtle back button — top-left of each inner screen
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
      className={`w-full bg-[#06B6D4] text-[#0A0A0A] font-semibold rounded-lg cursor-pointer border-none transition-all select-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#0891B2]'
      }`}
      style={{ padding: '14px', fontSize: 15, fontFamily: 'inherit', minHeight: 44 }}
    >
      {children}
    </button>
  );
}

// Reusable password input with show/hide toggle
function SecretInput({ placeholder, value, onChange, mono = true }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg outline-none"
        style={{
          background: '#0A0A0A',
          border: '1px solid #2A2A2A',
          padding: '10px 40px 10px 12px',
          fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
          color: '#F9FAFB',
          fontSize: 13,
          minHeight: 40,
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

// Progress dots — screens 2–5 (indices 1–4)
function ProgressDots({ screenIndex }) {
  const active = screenIndex - 1; // 0-based among the 4 inner screens
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            width: i === active ? 8 : 6,
            height: i === active ? 8 : 6,
            borderRadius: '50%',
            background: i === active ? '#06B6D4' : '#2A2A2A',
            transition: 'all 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Screen 1: Splash ───────────────────────────────────────────────────── */

function SplashScreen({ onNext }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#0A0A0A]">
      <div className="w-full h-1 shrink-0 bg-[#F97316]" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-[320px] mx-auto">
        {/* Logo */}
        <div
          className="flex items-center justify-center rounded-2xl mb-6"
          style={{ width: 80, height: 80, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}
        >
          <Command size={40} color="#06B6D4" strokeWidth={1.5} />
        </div>

        <h1
          className="text-white text-center m-0 mb-3"
          style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.5px' }}
        >
          Mission Control
        </h1>

        <p
          className="text-center m-0 mb-12"
          style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}
        >
          Your AI. Your tasks. Running while you sleep.
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

function SignInScreen({ onNext, onBack, onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const githubPopupRef = useRef(null);
  const [toastMsg, setToastMsg] = useState('');

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }

  /* ── Apple Sign In with Apple ─────────────────────────────────────────── */

  function loadAppleSDK() {
    if (window.AppleID) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Apple SDK'));
      document.head.appendChild(script);
    });
  }

  async function handleAppleClick() {
    const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
    if (!clientId || clientId === 'com.your.app.serviceid') {
      setError('Apple sign-in is not configured yet. Add VITE_APPLE_CLIENT_ID to your .env.local.');
      return;
    }
    setError('');
    setAppleLoading(true);
    try {
      await loadAppleSDK();
      window.AppleID.auth.init({
        clientId,
        scope: 'name email',
        redirectURI: window.location.origin,
        state: Math.random().toString(36).slice(2),
        usePopup: true,
      });
      const data = await window.AppleID.auth.signIn();
      // Decode the id_token JWT (base64url) to extract email
      const [, rawPayload] = data.authorization.id_token.split('.');
      const decoded = JSON.parse(atob(rawPayload.replace(/-/g, '+').replace(/_/g, '/')));
      setAppleLoading(false);
      onNext({ appleUser: { email: decoded.email, name: data.user?.name } });
    } catch (err) {
      setAppleLoading(false);
      if (err?.error !== 'popup_closed_by_user') {
        setError('Apple sign-in failed. Please try again or use another method.');
      }
    }
  }

  /* ── GitHub OAuth popup ───────────────────────────────────────────────── */

  function handleGitHubClick() {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId || clientId === 'your_github_client_id') {
      setError('GitHub sign-in is not configured yet. Add VITE_GITHUB_CLIENT_ID to your .env.local.');
      return;
    }
    setError('');
    setGithubLoading(true);

    const state = Math.random().toString(36).slice(2);
    sessionStorage.setItem('mc_github_state', state);

    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email&state=${state}`;
    const popup = window.open(url, 'github-oauth', 'width=600,height=700,left=200,top=100');
    githubPopupRef.current = popup;

    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'GITHUB_OAUTH') return;
      const saved = sessionStorage.getItem('mc_github_state');
      if (event.data.state !== saved) return;
      cleanup();
      sessionStorage.removeItem('mc_github_state');
      setGithubLoading(false);
      onNext({ githubCode: event.data.code });
    }

    function cleanup() {
      window.removeEventListener('message', onMessage);
      clearInterval(closedPoll);
    }

    window.addEventListener('message', onMessage);

    // Detect manual popup close
    const closedPoll = setInterval(() => {
      if (popup.closed) {
        cleanup();
        setGithubLoading(false);
      }
    }, 500);
  }

  // Google OAuth — popup flow
  const googleLogin = useGoogleLogin({
    onSuccess: async tokenResponse => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        setGoogleLoading(false);
        onNext({ googleUser: profile });
      } catch {
        setGoogleLoading(false);
        setError('Google sign-in failed. Please use email and password below.');
      }
    },
    onError: () => {
      setGoogleLoading(false);
      setError('Google sign-in was cancelled or failed. Please use email and password below.');
    },
    onNonOAuthError: () => {
      setGoogleLoading(false);
      setError('Could not open Google sign-in. Please use email and password below.');
    },
  });

  function handleGoogleClick() {
    setError('');
    setGoogleLoading(true);
    googleLogin();
  }

  function handleSignIn() {
    if (email === 'test' && password === 'test') {
      setError('');
      localStorage.setItem(STORAGE_KEY, 'true');
      onSignedIn();
    } else {
      setError('Invalid credentials. Try again.');
    }
  }

  const oauthBtnStyle = {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#1A1A1A', border: '1px solid #2A2A2A',
    color: '#F9FAFB', borderRadius: 8, padding: '12px 16px',
    fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
    width: '100%', minHeight: 44, fontWeight: 500,
    transition: 'border-color 0.15s',
  };

  return (
    <Card>
      <BackBtn onClick={onBack} />

      <p className="text-center m-0 mb-6" style={{ color: '#9CA3AF', fontSize: 12 }}>
        Mission Control
      </p>

      <h2
        className="text-white m-0 mb-1"
        style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.3px' }}
      >
        Welcome back.
      </h2>
      <p className="m-0 mb-8" style={{ color: '#9CA3AF', fontSize: 14 }}>
        Sign in to continue.
      </p>

      {/* OAuth buttons */}
      <div className="flex flex-col" style={{ gap: 10, marginBottom: 24 }}>

        {/* Google — live */}
        <button
          style={{
            ...oauthBtnStyle,
            opacity: googleLoading ? 0.7 : 1,
            cursor: googleLoading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.borderColor = '#3A3A3A'; }}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
          onClick={handleGoogleClick}
          disabled={googleLoading}
        >
          {googleLoading
            ? <Loader size={18} className="animate-spin" style={{ color: '#9CA3AF' }} />
            : <GoogleIcon />}
          {googleLoading ? 'Connecting…' : 'Continue with Google'}
        </button>

        {/* Apple */}
        <button
          style={{
            ...oauthBtnStyle,
            opacity: appleLoading ? 0.7 : 1,
            cursor: appleLoading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!appleLoading) e.currentTarget.style.borderColor = '#3A3A3A'; }}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
          onClick={handleAppleClick}
          disabled={appleLoading}
        >
          {appleLoading
            ? <Loader size={18} className="animate-spin" style={{ color: '#9CA3AF' }} />
            : <Apple size={18} />}
          {appleLoading ? 'Connecting…' : 'Continue with Apple'}
        </button>

        {/* GitHub */}
        <button
          style={{
            ...oauthBtnStyle,
            opacity: githubLoading ? 0.7 : 1,
            cursor: githubLoading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!githubLoading) e.currentTarget.style.borderColor = '#3A3A3A'; }}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
          onClick={handleGitHubClick}
          disabled={githubLoading}
        >
          {githubLoading
            ? <Loader size={18} className="animate-spin" style={{ color: '#9CA3AF' }} />
            : <Github size={18} />}
          {githubLoading ? 'Connecting…' : 'Continue with GitHub'}
        </button>

      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ background: '#2A2A2A' }} />
        <span style={{ color: '#9CA3AF', fontSize: 13 }}>or</span>
        <div className="flex-1 h-px" style={{ background: '#2A2A2A' }} />
      </div>

      {/* Email / password */}
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

      <p className="text-center mt-6 mb-0 text-[13px]" style={{ color: '#9CA3AF' }}>
        Don&apos;t have an account?{' '}
        <span className="cursor-pointer" style={{ color: '#06B6D4' }}>Sign up</span>
      </p>

      {toastMsg && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-[13px] text-white pointer-events-none"
          style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', zIndex: 100 }}
        >
          {toastMsg}
        </div>
      )}
    </Card>
  );
}

/* ─── Screen 3: Mode Selection ───────────────────────────────────────────── */

function ModeScreen({ onNext, onBack }) {
  const [selected, setSelected] = useState(null);

  const modes = [
    {
      id: 'dev',
      Icon: Code2,
      title: 'Dev Mode',
      desc: 'Submit feature requests. AI builds, branches, and ships code autonomously.',
    },
    {
      id: 'creator',
      Icon: Sparkles,
      title: 'Creator Mode',
      desc: "Market research, content strategy, song concepts, business plans — done while you're away.",
    },
  ];

  return (
    <Card>
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

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {modes.map(({ id, Icon, title, desc }) => {
          const isSelected = selected === id;
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className="flex-1 text-left rounded-xl cursor-pointer border-none transition-all select-none"
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
    </Card>
  );
}

/* ─── Screen 4: Connect AI Keys ──────────────────────────────────────────── */

function KeysScreen({ onNext, onBack }) {
  const [keys, setKeys] = useState({ anthropic: '', openai: '', gemini: '' });

  function setKey(name, val) {
    setKeys(prev => ({ ...prev, [name]: val }));
  }

  const cardStyle = {
    background: '#111111',
    border: '1px solid #2A2A2A',
    borderRadius: 10,
    padding: 16,
  };

  const providers = [
    {
      id: 'anthropic',
      logo: (
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 24, height: 24, background: '#CC785C', border: '1px solid #B5603C' }}
        >
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>A</span>
        </div>
      ),
      label: 'Anthropic',
      badge: 'Claude',
      desc: 'Powers Claude models — Haiku, Sonnet, and Opus.',
      placeholder: 'sk-ant-...',
      link: { href: 'https://console.anthropic.com', text: 'Get your key →' },
    },
    {
      id: 'openai',
      logo: (
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 24, height: 24, background: '#10A37F', border: '1px solid #0D8A6A' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M22.28 9.29a5.44 5.44 0 0 0-.46-4.48 5.5 5.5 0 0 0-5.92-2.63A5.5 5.5 0 0 0 11.77 0a5.5 5.5 0 0 0-5.24 3.8 5.5 5.5 0 0 0-3.67 2.67 5.52 5.52 0 0 0 .68 6.47 5.44 5.44 0 0 0 .46 4.48 5.5 5.5 0 0 0 5.92 2.63A5.5 5.5 0 0 0 12.23 24a5.5 5.5 0 0 0 5.24-3.81 5.5 5.5 0 0 0 3.67-2.67 5.52 5.52 0 0 0-.68-6.47l.02.24z"/>
          </svg>
        </div>
      ),
      label: 'OpenAI',
      badge: 'GPT-4o',
      desc: 'Powers GPT-4o and o-series reasoning models.',
      placeholder: 'sk-...',
      link: { href: 'https://platform.openai.com/api-keys', text: 'Get your key →' },
    },
    {
      id: 'gemini',
      logo: (
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 24, height: 24, background: '#1A73E8', border: '1px solid #1557B0' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
      ),
      label: 'Google Gemini',
      badge: 'Gemini',
      desc: 'Powers Gemini Pro and Flash models.',
      placeholder: 'AIza...',
      link: { href: 'https://aistudio.google.com/app/apikey', text: 'Get your key →' },
    },
  ];

  return (
    <Card>
      <BackBtn onClick={onBack} />

      <h2
        className="text-white m-0 mb-2"
        style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px' }}
      >
        Connect your AI keys.
      </h2>
      <p className="m-0 mb-8" style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6 }}>
        Add whichever providers you use. You pay them directly — we never touch your billing.
      </p>

      <div className="flex flex-col" style={{ gap: 12, marginBottom: 32 }}>
        {providers.map(({ id, logo, label, badge, desc, placeholder, link }) => (
          <div key={id} style={cardStyle}>
            {/* Header row */}
            <div className="flex items-center gap-2.5 mb-1">
              {logo}
              <span className="text-white" style={{ fontSize: 14, fontWeight: 500 }}>
                {label}
              </span>
              <span
                className="rounded"
                style={{
                  background: '#1A1A1A', border: '1px solid #2A2A2A',
                  color: '#9CA3AF', fontSize: 10, fontWeight: 500,
                  padding: '1px 6px', lineHeight: '16px',
                }}
              >
                {badge}
              </span>
            </div>
            <p className="m-0 mb-3" style={{ color: '#9CA3AF', fontSize: 12 }}>
              {desc}
            </p>
            <SecretInput
              placeholder={placeholder}
              value={keys[id]}
              onChange={e => setKey(id, e.target.value)}
            />
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 no-underline"
              style={{ color: '#06B6D4', fontSize: 11 }}
            >
              {link.text}
            </a>
          </div>
        ))}
      </div>

      {/* Skip / Save buttons */}
      <div className="flex flex-col md:flex-row gap-3">
        <button
          onClick={() => onNext()}
          className="flex-1 rounded-lg cursor-pointer select-none text-[14px] font-medium transition-colors"
          style={{
            background: 'transparent', border: '1px solid #2A2A2A',
            color: '#9CA3AF', padding: '12px 20px', fontFamily: 'inherit', minHeight: 44,
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#3A3A3A')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
        >
          Skip for now
        </button>
        <button
          onClick={() => onNext({ keys })}
          className="flex-1 rounded-lg cursor-pointer select-none text-[14px] font-semibold transition-colors"
          style={{
            background: '#06B6D4', border: 'none',
            color: '#0A0A0A', padding: '12px 20px', fontFamily: 'inherit', minHeight: 44,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#0891B2')}
          onMouseLeave={e => (e.currentTarget.style.background = '#06B6D4')}
        >
          Save &amp; Continue
        </button>
      </div>
    </Card>
  );
}

/* ─── Screen 5: Walkthrough ──────────────────────────────────────────────── */

function WalkthroughScreen({ onNext, onBack }) {
  const steps = [
    {
      num: '01',
      title: 'Drop a request',
      body: 'Type what you want built or researched in plain English.',
    },
    {
      num: '02',
      title: 'We get to work',
      body: 'Mission Control assigns it to AI and runs it in the background autonomously.',
    },
    {
      num: '03',
      title: 'Come back to results',
      body: 'Find your build shipped, your research done, or your content ready — in app, as a doc, or in your email.',
    },
  ];

  return (
    <Card>
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

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {steps.map(({ num, title, body }) => (
          <div
            key={num}
            className="flex-1 rounded-xl p-5"
            style={{ background: '#111111', border: '1px solid #2A2A2A' }}
          >
            <p
              className="m-0 mb-3"
              style={{ color: '#06B6D4', fontSize: 28, fontWeight: 700, lineHeight: 1, fontFamily: 'inherit' }}
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
    </Card>
  );
}

/* ─── Screen 6: Done (auto-advance) ─────────────────────────────────────── */

function DoneScreen({ onComplete }) {
  const [phase, setPhase] = useState(0);

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
            transform: 'scale(1)', opacity: 1,
            transition: 'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
          }}
        >
          <Check size={36} color="#06B6D4" strokeWidth={2.5} />
        </div>

        <div
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          <h2 className="text-white m-0 mb-2" style={{ fontSize: 28, fontWeight: 600 }}>
            You&apos;re all set.
          </h2>
          <p className="m-0" style={{ color: '#9CA3AF', fontSize: 14 }}>
            Mission Control is ready.
          </p>
        </div>
      </div>
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

  // Forward: exit left (-40px), enter from right (+40px)
  // Back:    exit right (+40px), enter from left (-40px)
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

/* ─── Root OnboardingFlow ────────────────────────────────────────────────── */

export default function OnboardingFlow({ onComplete }) {
  const [screenIndex, setScreenIndex] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [userData, setUserData] = useState({ mode: null });

  function advance(data = {}) {
    setUserData(prev => ({ ...prev, ...data }));
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
      case 2: return <ModeScreen onNext={data => { if (data?.mode) localStorage.setItem('mc_user_mode', data.mode); advance(data); }} onBack={goBack} />;
      case 3: return <KeysScreen onNext={data => advance(data)} onBack={goBack} />;
      case 4: return <WalkthroughScreen onNext={() => advance()} onBack={goBack} />;
      case 5: return <DoneScreen onComplete={onComplete} />;
      default: return null;
    }
  })();

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {showDots && (
        <>
          <div className="hidden md:block fixed top-0 left-0 right-0 z-50">
            <ProgressDots screenIndex={screenIndex} />
          </div>
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <ProgressDots screenIndex={screenIndex} />
          </div>
        </>
      )}

      <SlideTransition screenIndex={screenIndex} direction={direction}>
        {screen}
      </SlideTransition>
    </div>
  );
}

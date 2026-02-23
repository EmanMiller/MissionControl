import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Zap, Github, Apple, Loader2 } from 'lucide-react';
import apiClient from './services/api.js';

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */

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

export default function OnboardingFlow({ onAuthSuccess }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState(null);

  // Handle URL parameters for GitHub OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleGitHubCallback(code, state);
    }
  }, []);

  async function handleGitHubCallback(code, state) {
    setIsAuthenticating(true);
    setError(null);
    
    try {
      const response = await apiClient.loginWithGitHub(code, state);
      if (response.success) {
        onAuthSuccess(response);
      } else {
        setError('GitHub authentication failed');
      }
    } catch (error) {
      console.error('GitHub auth error:', error);
      setError(error.message);
    } finally {
      setIsAuthenticating(false);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setIsAuthenticating(true);
    setError(null);
    
    try {
      const response = await apiClient.loginWithGoogle(credentialResponse.credential);
      if (response.success) {
        onAuthSuccess(response);
      } else {
        setError('Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleGitHubLogin() {
    try {
      // Get GitHub OAuth URL from backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/github`);
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.details || data.error || 'Failed to initiate GitHub authentication');
      }
    } catch (error) {
      console.error('GitHub login error:', error);
      setError('Failed to connect to authentication server');
    }
  }

  async function handleAppleLogin() {
    setError('Apple Sign In requires additional configuration. Please use Google or GitHub for now.');
  }

  async function handleDemoLogin() {
    setIsAuthenticating(true);
    setError(null);
    try {
      const response = await apiClient.loginWithDemo();
      if (response.success) {
        onAuthSuccess(response);
      } else {
        setError('Demo sign-in failed');
      }
    } catch (err) {
      console.error('Demo login error:', err);
      setError(err.message || 'Demo sign-in failed');
    } finally {
      setIsAuthenticating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-xl flex items-center justify-center">
              <Zap size={24} className="text-white sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
            </div>
          </div>
          
          <h1 className="text-[#F9FAFB] text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">Welcome to Mission Control</h1>
          <p className="text-[#9CA3AF] text-sm sm:text-base lg:text-lg leading-relaxed px-2 sm:px-4">
            An autonomous network of AI agents that operates around the clock, 
            executing tasks and generating value continuously.
          </p>
        </div>

        {/* Authentication Options */}
        <div className="space-y-3 sm:space-y-4">
          {error && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-3 sm:p-4 text-[#EF4444] text-sm sm:text-base">
              {error}
            </div>
          )}

          {/* Production OAuth only - no demo mode */}

          {/* Google OAuth */}
          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={(error) => {
                  console.error('Google Sign In error:', error);
                  setError('Google Sign In failed. Please contact support if this issue persists.');
                }}
                theme="filled_black"
                shape="pill"
                size="large"
                text="continue_with"
                disabled={isAuthenticating}
                useOneTap={false}
                auto_select={false}
                cancel_on_tap_outside={false}
              />
            </div>
          ) : (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-4">
              <h3 className="text-[#EF4444] text-sm font-semibold mb-2">OAuth Configuration Required</h3>
              <p className="text-[#9CA3AF] text-xs">
                Google authentication is not configured. Please contact your administrator to set up OAuth credentials.
              </p>
            </div>
          )}

          {/* Demo sign-in (development / E2E) */}
          {(import.meta.env.VITE_ALLOW_DEMO === 'true' || import.meta.env.DEV) && (
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isAuthenticating}
              className="w-full bg-[#374151] hover:bg-[#4B5563] border border-[#4B5563] text-[#E5E7EB] text-sm sm:text-base font-medium rounded-lg p-3 sm:p-4 flex items-center justify-center gap-3 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isAuthenticating ? <Loader2 size={18} className="animate-spin" /> : 'Continue as Demo'}
            </button>
          )}

          {/* GitHub OAuth */}
          <button
            onClick={handleGitHubLogin}
            disabled={isAuthenticating}
            className="w-full bg-[#24292F] hover:bg-[#32383F] border-none text-white text-sm sm:text-base font-medium rounded-lg p-3 sm:p-4 flex items-center justify-center gap-3 cursor-pointer transition-colors disabled:opacity-50"
            style={{ fontFamily: 'inherit' }}
          >
            {isAuthenticating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Github size={18} />
            )}
            Continue with GitHub
          </button>

          {/* Apple Sign In */}
          <button
            onClick={handleAppleLogin}
            disabled={isAuthenticating}
            className="w-full bg-[#000000] hover:bg-[#1D1D1F] border border-[#2A2A2A] text-white text-sm sm:text-base font-medium rounded-lg p-3 sm:p-4 flex items-center justify-center gap-3 cursor-pointer transition-colors disabled:opacity-50"
            style={{ fontFamily: 'inherit' }}
          >
            <Apple size={18} />
            Continue with Apple
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-[#6B7280] text-xs sm:text-sm leading-relaxed px-2">
            By signing in, you agree to connect your OpenClaw instance to Mission Control 
            for autonomous task processing and management.
          </p>
          
          {/* OAuth Setup Guide - Hidden on mobile to save space */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[#111111] border border-[#2A2A2A] rounded-lg text-left hidden sm:block">
            <h4 className="text-[#F9FAFB] text-sm font-semibold mb-2">OAuth Setup Guide</h4>
            <div className="space-y-2 text-xs text-[#9CA3AF]">
              <p><strong>Google:</strong> Create OAuth client at <span className="text-[#06B6D4]">console.cloud.google.com</span></p>
              <p><strong>Authorized origins:</strong> http://localhost:5173</p>
              <p><strong>GitHub:</strong> Create OAuth app at <span className="text-[#06B6D4]">github.com/settings/developers</span></p>
              <p><strong>Callback URL:</strong> http://localhost:5173</p>
            </div>
          </div>

          {/* Simplified mobile setup hint */}
          <div className="mt-4 p-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-center sm:hidden">
            <p className="text-[#9CA3AF] text-xs">
              Need help setting up OAuth? <span className="text-[#06B6D4]">View setup guide on desktop</span>
            </p>
          </div>
        </div>

        {/* Loading Overlay */}
        {isAuthenticating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4 sm:p-6 flex items-center gap-3 mx-4">
              <Loader2 size={20} className="animate-spin text-[#06B6D4]" />
              <span className="text-[#F9FAFB] text-sm sm:text-base">Authenticating...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
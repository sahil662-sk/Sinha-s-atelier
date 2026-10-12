'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  Sparkles,
  Award,
  Truck,
  Gem,
  Eye,
  EyeOff
} from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const BACKGROUND_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1920&auto=format&fit=crop',
    caption: 'Precision Titanium Horology',
  },
  {
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1920&auto=format&fit=crop',
    caption: 'Acoustic Synthesizer Architecture',
  },
  {
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1920&auto=format&fit=crop',
    caption: 'Spun Brass Desk Sculptures',
  },
  {
    url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1920&auto=format&fit=crop',
    caption: 'Aluminium Sound Engineering',
  },
];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [currentSlide, setCurrentSlide] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BACKGROUND_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 404
            ? 'Authentication route not found (/api/auth/login).'
            : 'Authentication service temporarily unavailable.'
        );
      }

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      const userObj = data.user || {
        email: cleanEmail,
        name: cleanEmail.split('@')[0].toUpperCase(),
        role: 'USER',
      };

      sessionStorage.removeItem('admin_unlocked_session');

      localStorage.setItem('user', JSON.stringify(userObj));
      localStorage.setItem('token', data.token || 'session_' + Date.now());
      
      window.dispatchEvent(new Event('auth-updated'));
      window.dispatchEvent(new Event('auth-change'));

      if (userObj.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify email and passcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          password,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Registration endpoint unavailable.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create client account.');
      }

      const userObj = data.user || {
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        role: 'USER',
      };

      sessionStorage.removeItem('admin_unlocked_session');

      localStorage.setItem('user', JSON.stringify(userObj));
      localStorage.setItem('token', data.token || 'session_' + Date.now());
      window.dispatchEvent(new Event('auth-updated'));
      window.dispatchEvent(new Event('auth-change'));

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Forgot password endpoint unavailable.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Email not found in registered client registry.');
      }

      const returnedCode = data.code || '8821';
      setSuccessMsg(`Verification code generated: ${returnedCode}. Please enter your new passcode.`);
      setResetCode(returnedCode);
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          code: resetCode.trim(),
          newPassword,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Reset password endpoint unavailable.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired verification code.');
      }

      setSuccessMsg('Passcode reset successfully! Please sign in with your new passcode.');
      setMode('login');
      setPassword('');
      setShowPassword(false);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-neutral-900 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center overflow-hidden">
      
      {/* 1. CINEMATIC FULLSCREEN BACKGROUND SLIDESHOW */}
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {BACKGROUND_SLIDES.map((slide, idx) => (
          <div
            key={slide.url}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.url}
              alt={slide.caption}
              className={`w-full h-full object-cover transition-transform duration-[7000ms] ease-out ${
                idx === currentSlide ? 'scale-105' : 'scale-100'
              }`}
            />
          </div>
        ))}
      </div>

      {/* 2. ATMOSPHERIC VIGNETTE & BLUR OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/95 via-[#0b1120]/75 to-[#020617]/85 backdrop-blur-[6px] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf815_1px,transparent_1px)] [background-size:32px_32px] opacity-30 -z-10" />

      {/* Ambient Sapphire & Violet Glow Orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[34rem] h-[34rem] bg-indigo-600/25 rounded-full blur-[140px] animate-pulse -z-10" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[34rem] h-[34rem] bg-sky-500/20 rounded-full blur-[140px] animate-pulse -z-10" />

      {/* MAIN CONTAINER */}
      <div className="max-w-5xl w-full z-10 my-auto">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-100 hover:text-white transition-all cursor-pointer bg-white/10 hover:bg-white/15 px-4 py-2.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
            <span>Return to Boutique</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-md text-[10px] font-mono text-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            <span>Archive View: {BACKGROUND_SLIDES[currentSlide].caption}</span>
          </div>
        </div>

        {/* LUXURY SPLIT CARD */}
        <div className="overflow-hidden rounded-[2.5rem] bg-white border border-white/20 shadow-[0_25px_60px_-15px_rgba(2,6,23,0.7)] grid grid-cols-1 lg:grid-cols-12 backdrop-blur-xl">
          
          {/* Left Panel: Midnight Royal Sapphire */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#070d19] via-[#0d162a] to-[#040812] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/60">
            <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#38bdf80c_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />
            
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[10px] font-mono tracking-widest uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Private Client Portal</span>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-serif tracking-tight leading-snug text-slate-100">
                  Welcome to <br />
                  <span className="font-sans font-black italic bg-gradient-to-r from-sky-200 via-amber-200 to-rose-200 bg-clip-text text-transparent">
                    Sinha&apos;s Atelier.
                  </span>
                </h1>
                <p className="text-xs text-slate-300/80 mt-2.5 leading-relaxed font-light">
                  Authenticate your identity to view reserved timepieces, track white-glove consignments, and manage private acquisitions.
                </p>
              </div>

              <div className="space-y-3.5 pt-5 border-t border-slate-800/80">
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <div className="w-7 h-7 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0">
                    <Gem className="w-3.5 h-3.5 text-sky-300" />
                  </div>
                  <span>Exclusive allocation on numbered editions</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <div className="w-7 h-7 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0">
                    <Truck className="w-3.5 h-3.5 text-sky-300" />
                  </div>
                  <span>Priority insured air courier to door</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <div className="w-7 h-7 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0">
                    <Award className="w-3.5 h-3.5 text-sky-300" />
                  </div>
                  <span>Verified digital certificate of authenticity</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8 mt-6 border-t border-slate-800/80">
              <p className="text-[11px] font-serif italic text-slate-300">
                &ldquo;True elegance lies in the purity of proportion and materials.&rdquo;
              </p>
              <p className="text-[10px] font-mono text-amber-300/90 mt-1 uppercase tracking-wider font-semibold">
                &mdash; Connaught Place Studio, New Delhi
              </p>
            </div>
          </div>

          {/* Right Panel: Form with Password Eye Viewers */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
            
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-2xl mb-8 border border-stone-200">
              <button
                type="button"
                onClick={() => { clearMessages(); setMode('login'); }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { clearMessages(); setMode('signup'); }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-stone-950 tracking-tight">
                {mode === 'login' && 'Sign In to Account'}
                {mode === 'signup' && 'Create Client Account'}
                {mode === 'forgot' && 'Reset Access Passcode'}
                {mode === 'reset' && 'Verify & Update Passcode'}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {mode === 'login' && 'Enter your registered credentials to access your private vault.'}
                {mode === 'signup' && 'Register your details for priority deliveries and client ledger.'}
                {mode === 'forgot' && 'Enter your email to generate a secure reset passcode.'}
                {mode === 'reset' && 'Enter your verification code and set a new secure passcode.'}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium text-center">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-center gap-2 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORM 1: LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5 font-bold">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full pl-11 pr-4 py-3 text-xs rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-slate-900 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 font-bold">
                      Passcode
                    </label>
                    <button
                      type="button"
                      onClick={() => { clearMessages(); setMode('forgot'); }}
                      className="text-[11px] text-sky-800 hover:text-sky-950 hover:underline font-bold cursor-pointer"
                    >
                      Forgot passcode?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 text-xs rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-slate-900 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-slate-950/20"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Account'}</span>
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                </button>
              </form>
            )}

            {/* FORM 2: SIGN UP */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5 font-bold">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sahil Kumar"
                      className="w-full pl-11 pr-4 py-3 text-xs rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-slate-900 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5 font-bold">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full pl-11 pr-4 py-3 text-xs rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-slate-900 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5 font-bold">
                    Phone Number (+91)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-11 pr-4 py-3 text-xs rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-slate-900 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5 font-bold">
                    Create Secure Passcode
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 text-xs rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-slate-900 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-slate-950/20"
                >
                  <span>{loading ? 'Registering...' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                </button>
              </form>
            )}

            {/* FORM 3: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5 font-bold">
                    Registered Client Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full pl-11 pr-4 py-3 text-xs rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-slate-900 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span>{loading ? 'Verifying...' : 'Generate Reset Code'}</span>
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { clearMessages(); setMode('login'); }}
                    className="text-xs font-bold text-stone-600 hover:text-stone-950 cursor-pointer"
                  >
                    &larr; Return to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* FORM 4: RESET PASSWORD */}
            {mode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5 font-bold">
                    Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Enter verification code"
                      className="w-full pl-11 pr-4 py-3 text-xs rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-slate-900 transition-all font-mono tracking-widest text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5 font-bold">
                    New Passcode
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New secure passcode"
                      className="w-full pl-11 pr-11 py-3 text-xs rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-slate-900 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span>{loading ? 'Updating...' : 'Set New Passcode'}</span>
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { clearMessages(); setMode('login'); }}
                    className="text-xs font-bold text-stone-600 hover:text-stone-950 cursor-pointer"
                  >
                    Cancel &amp; Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Security Footer */}
            <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-center gap-2 text-[10px] text-stone-400 font-mono uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
              <span>256-Bit SSL Atelier Protection &bull; Private Ledger</span>
            </div>

          </div>

        </div>

        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {BACKGROUND_SLIDES.map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => setCurrentSlide(dotIdx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                dotIdx === currentSlide 
                  ? 'w-8 bg-sky-400' 
                  : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Slide ${dotIdx + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';

export const AuthCard = ({ mode }) => {
  const navigate = useNavigate();
  const { login, register, error: apiError, clearError } = useAuthStore();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Local UX state
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Clean errors on mode change
  useEffect(() => {
    setValidationError('');
    if (clearError) clearError();
  }, [mode, clearError]);

  // Password strength logic
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score === 1) return { score: 1, text: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, text: 'Medium', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, text: 'Strong', color: 'bg-emerald-500' };
    return { score: 0, text: '', color: 'bg-slate-200' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setIsLoading(true);

    if (mode === 'register') {
      if (!name.trim() || !/^[A-Za-z\s]+$/.test(name)) {
        setValidationError('Full Name must contain only letters and spaces');
        setIsLoading(false);
        return;
      }
      if (!email.trim() || !/^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        setValidationError('Please enter a valid email address starting with a letter');
        setIsLoading(false);
        return;
      }
      if (password.length < 8) {
        setValidationError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }

      const res = await register(name, email, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setIsLoading(false);
      }
    } else {
      if (!email.trim() || !/^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        setValidationError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }
      if (!password) {
        setValidationError('Password is required');
        setIsLoading(false);
        return;
      }

      const res = await login(email, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`auth-container ${mode === 'login' ? 'login-active' : ''}`}>
      
      {/* ================= FORM PANEL (White background, absolute right/slides left) ================= */}
      <div className="auth-side-panel auth-form-side">
        <div className="w-full max-w-md px-8 py-12 relative flex flex-col justify-center min-h-[500px]">
          
          {/* Mobile Header: Logo */}
          <div className="md:hidden flex items-center gap-2 mb-6">
            <span className="text-2xl font-bold tracking-tighter text-primary-500">🏛️ LexAI</span>
          </div>

          {/* Validation & Api Errors */}
          {(validationError || apiError) && (
            <div className="p-4 mb-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 animate-slide-up text-sm font-medium">
              <span className="text-lg leading-none">⚠️</span>
              <div>{validationError || apiError}</div>
            </div>
          )}

          {/* REGISTER FORM */}
          <div className={`transition-all duration-700 ease-in-out delay-100 ${mode === 'register' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-8 pointer-events-none absolute w-[calc(100%-4rem)]'}`}>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-base text-slate-500 mt-2 mb-8">Start simplifying legal documents for free.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Full Name</label>
                <div className="relative flex items-center">
                  <User className="w-5 h-5 text-slate-400 absolute left-4" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-100 focus:bg-white border-2 border-transparent focus:border-primary-500/25 rounded-xl text-base font-medium outline-none transition-all placeholder:text-slate-400 cursor-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-100 focus:bg-white border-2 border-transparent focus:border-primary-500/25 rounded-xl text-base font-medium outline-none transition-all placeholder:text-slate-400 cursor-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-100 focus:bg-white border-2 border-transparent focus:border-primary-500/25 rounded-xl text-base font-medium outline-none transition-all cursor-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Strength Meter matching visual spec */}
                <div className="mt-3">
                  <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-slate-100">
                    <div className={`h-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-transparent'} w-1/3`}></div>
                    <div className={`h-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-transparent'} w-1/3`}></div>
                    <div className={`h-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-transparent'} w-1/3`}></div>
                  </div>
                  <p className="text-xs font-medium text-slate-400 mt-1.5">
                    {strength.text ? `Strength: ${strength.text}. ` : ''}Must be at least 8 characters.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-base uppercase tracking-wide transition-all shadow-md shadow-primary-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="w-full flex items-center justify-center gap-4 text-slate-350 text-xs font-semibold tracking-wider">
                <span className="h-[1px] bg-slate-150 flex-1"></span>
                OR
                <span className="h-[1px] bg-slate-150 flex-1"></span>
              </div>
              <p className="text-sm font-medium text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm font-bold text-sky-900 hover:underline"
                >
                  Log in
                </button>
              </p>
            </div>
          </div>

          {/* LOGIN FORM */}
          <div className={`transition-all duration-700 ease-in-out delay-100 ${mode === 'login' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-8 pointer-events-none absolute w-[calc(100%-4rem)]'}`}>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-base text-slate-500 mt-2 mb-8">Access your analyzed documents instantly.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-100 focus:bg-white border-2 border-transparent focus:border-primary-500/25 rounded-xl text-base font-medium outline-none transition-all placeholder:text-slate-400 cursor-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-100 focus:bg-white border-2 border-transparent focus:border-primary-500/25 rounded-xl text-sm font-medium outline-none transition-all cursor-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-base transition-all shadow-md shadow-primary-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'SIGN IN'
                )}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="w-full flex items-center justify-center gap-4 text-slate-350 text-xs font-semibold tracking-wider">
                <span className="h-[1px] bg-slate-150 flex-1"></span>
                OR
                <span className="h-[1px] bg-slate-150 flex-1"></span>
              </div>
              <p className="text-sm font-medium text-slate-500">
                New to LexAI?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-sm font-bold text-sky-900 hover:underline"
                >
                  Create account
                </button>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ================= VISUAL SIDE PANEL (Blue brand screen, absolute left/slides right) ================= */}
      <div className="auth-side-panel auth-visual-side hidden md:flex p-16">
        
        {/* Brand Header */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
            🏛️ LexAI
          </span>
        </div>

        {/* Visual Mockup mimicking the PDF interactive analyze mockup */}
        <div className="my-auto max-w-sm">
          <h2 className="text-[3.5rem] font-extrabold leading-[1.1] tracking-tight mb-8">
            Know what you're signing before you sign it.
          </h2>
          
          {/* Custom glassmorphism preview panel */}
          <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl animate-fade-in">
            {/* Sparkles green badge */}
            <div className="absolute -top-3.5 -right-2 bg-[#0C7B42] text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#A4FFA4]" />
              AI Analyzed
            </div>

            {/* Document Card skeleton inside spec image */}
            <div className="w-full aspect-[16/10] bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between p-4">
              <div className="flex items-center justify-center flex-1">
                <span className="text-4xl opacity-45">📄</span>
              </div>
              <div className="space-y-2.5">
                <div className="h-2 w-2/3 bg-white/25 rounded"></div>
                <div className="h-2 w-full bg-white/15 rounded"></div>
                <div className="h-2 w-5/6 bg-white/15 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-white">Built by <strong>Bernesh</strong></span>
            <a href="https://github.com/Bernesh-stack" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/bernesh/" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              LinkedIn
            </a>
          </div>
          <p className="text-xs font-medium tracking-wide text-slate-400">
            &copy; {new Date().getFullYear()} LexAI. The Cognitive Architect.
          </p>
        </div>
      </div>
      
    </div>
  );
};

export default AuthCard;

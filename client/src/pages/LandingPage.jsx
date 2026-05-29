import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Shield, Zap, Search, ChevronRight, FileText, Lock, BarChart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white selection:bg-primary-500/30 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0A0F1C]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <span className="text-xl font-bold tracking-tight">LexAI</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-sm font-semibold rounded-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</Link>
                <Link to="/register" className="px-5 py-2 bg-white text-slate-900 hover:bg-slate-200 text-sm font-semibold rounded-lg transition-all">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/40 via-[#0A0F1C] to-[#0A0F1C]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-primary-300 mb-8 backdrop-blur-md">
            <SparklesIcon className="w-4 h-4" /> Introducing LexAI 2.0
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Intelligent Contract Review <br /> & Risk Assessment
          </h1>
          <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Know exactly what you're signing before you sign it. LexAI uses advanced language models to extract clauses, identify risks, and simplify legalese in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to="/dashboard" className="group px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                Go to Dashboard <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link to="/register" className="group px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                Start for Free <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <a href="#how-it-works" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl text-base transition-all flex items-center justify-center">
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#0A0F1C] border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful capabilities, simplified</h2>
            <p className="text-slate-400">Everything you need to analyze contracts with confidence.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Search className="w-6 h-6 text-primary-400" />}
              title="Instant Extraction"
              description="Upload any PDF and instantly extract critical clauses, obligations, and definitions without manual reading."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-rose-400" />}
              title="Risk Detection"
              description="Automatically flag high-risk terms, hidden liabilities, and unusual conditions based on industry standards."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-amber-400" />}
              title="Plain English Translation"
              description="Convert complex legalese into simple, understandable terms so anyone can grasp the document's true meaning."
            />
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="py-24 bg-[#0F1629] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-slate-400">From upload to insight in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-primary-500/0 via-primary-500/50 to-primary-500/0 z-0"></div>
            
            <StepCard number="1" icon={<FileText className="w-8 h-8" />} title="Upload Document" description="Securely upload your legal PDF contract to our encrypted servers." />
            <StepCard number="2" icon={<BarChart className="w-8 h-8" />} title="AI Analysis" description="Our proprietary AI engine scans, extracts, and analyzes every clause." />
            <StepCard number="3" icon={<Shield className="w-8 h-8" />} title="Review Results" description="Get a comprehensive risk report with simplified explanations." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#0A0F1C]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <span className="text-lg font-bold">LexAI</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} LexAI Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const SparklesIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-primary-500/30 hover:bg-white/10 transition-all group">
    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{description}</p>
  </div>
);

const StepCard = ({ number, icon, title, description }) => (
  <div className="relative z-10 flex flex-col items-center text-center">
    <div className="w-24 h-24 rounded-full bg-[#0F1629] border border-primary-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
      <div className="text-primary-400">{icon}</div>
    </div>
    <div className="absolute top-0 right-0 mr-4 -mt-2 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold shadow-lg">
      {number}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed max-w-xs">{description}</p>
  </div>
);

export default LandingPage;

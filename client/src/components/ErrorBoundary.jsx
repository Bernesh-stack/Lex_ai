import React from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-8 leading-relaxed text-sm">
              An unexpected error occurred in the application. We've been notified and are looking into it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all"
              >
                Reload Page
              </button>
              <a 
                href="/"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-all"
              >
                <Home className="w-4 h-4" /> Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

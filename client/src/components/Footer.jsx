import React from 'react';
import { Github, Linkedin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full py-6 mt-auto border-t border-slate-200 bg-white/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-500 font-medium">
          Built by <span className="text-slate-800 font-semibold">Bernesh</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Bernesh-stack"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/bernesh/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
};

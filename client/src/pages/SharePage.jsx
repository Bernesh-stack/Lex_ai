import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { AlertCircle, FileText, Calendar, Lock, ShieldAlert, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const ClauseCard = ({ clause }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const riskColor = clause.finalRiskLevel === 'high' ? 'border-red-500' : 
                    clause.finalRiskLevel === 'medium' ? 'border-amber-500' : 
                    'border-emerald-500';

  const riskBadge = clause.finalRiskLevel === 'high' ? 'bg-red-100 text-red-700' : 
                    clause.finalRiskLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 
                    'bg-emerald-100 text-emerald-700';

  return (
    <div className={clsx("rounded-xl border-l-4 p-5 shadow-sm bg-white border-t border-r border-b border-slate-100 mb-4 transition-all", riskColor)}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-slate-800 text-lg leading-tight">{clause.clauseTitle}</h3>
        <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider", riskBadge)}>
          {clause.finalRiskLevel} Risk
        </span>
      </div>
      
      <div className="text-slate-600 text-sm mb-4 leading-relaxed whitespace-pre-wrap">
        {showOriginal ? clause.originalText : clause.simplifiedText}
      </div>
      
      {clause.triggeredKeywords?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {clause.triggeredKeywords.map((kw, i) => (
            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">
              {kw}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <button 
          onClick={() => setShowOriginal(!showOriginal)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
        >
          {showOriginal ? 'Show Simplified Summary' : 'Show Original Clause'}
        </button>
      </div>
    </div>
  );
};

export const SharePage = () => {
  const { token } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['share', token],
    queryFn: async () => {
      const res = await api.get(`/share/${token}`);
      return res.data;
    },
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
        <p className="text-slate-500 font-medium">Loading secure document...</p>
      </div>
    );
  }

  if (isError) {
    const isExpired = error?.response?.status === 410;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            {isExpired ? 'Link Expired' : 'Invalid Link'}
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            {isExpired 
              ? 'This secure sharing link has expired. Please ask the document owner for a new link.'
              : 'This link is invalid or the document has been removed.'}
          </p>
          <Link to="/" className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-500 transition-colors inline-block w-full">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const getRiskLabel = (score) => {
    if (score >= 8) return { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-500' };
    if (score >= 5) return { label: 'Medium Risk', color: 'text-amber-600', bg: 'bg-amber-500' };
    return { label: 'Low Risk', color: 'text-emerald-600', bg: 'bg-emerald-500' };
  };
  
  const riskInfo = getRiskLabel(data.riskScore || 1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner CTA */}
      <div className="bg-primary-600 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center text-sm sm:text-base sticky top-0 z-20">
        <p className="font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-200" /> This is a read-only shared document from LexAI.
        </p>
        <Link to="/register" className="bg-white text-primary-700 px-4 py-1.5 rounded-full font-bold shadow-sm hover:bg-primary-50 transition-colors whitespace-nowrap">
          Analyse Your Own Contracts
        </Link>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md flex items-center gap-1.5 uppercase tracking-wide">
                <Lock className="w-3 h-3" /> Secure Share
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Calendar className="w-3 h-3" /> Expires {format(new Date(data.shareExpiry), 'MMM d, yyyy')}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-500" />
              {data.fileName}
            </h1>
          </div>
        </div>

        {/* Risk Score */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between mb-8 relative overflow-hidden">
          <div className="relative z-10 w-full text-center sm:text-left mb-4 sm:mb-0">
            <h2 className="text-slate-500 font-bold mb-2 text-xs uppercase tracking-widest">Overall Risk Score</h2>
            <div className="flex items-baseline justify-center sm:justify-start gap-2">
              <span className={clsx("text-5xl font-extrabold tracking-tight", riskInfo.color)}>
                {data.riskScore || 1}
              </span>
              <span className="text-slate-400 text-xl font-medium">/ 10</span>
            </div>
          </div>
          <div className="text-center sm:text-right relative z-10 w-full">
            <div className={clsx("inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold text-white mb-2 shadow-sm", riskInfo.bg)}>
              {riskInfo.label}
            </div>
            <p className="text-sm text-slate-500 font-medium">Based on {data.clauses?.length || 0} analysed clauses</p>
          </div>
          <div className={clsx("absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-5 blur-2xl pointer-events-none", riskInfo.bg)}></div>
        </div>

        {/* Clauses List */}
        <div className="space-y-4">
          <div className="flex items-end justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-800">Clause Analysis</h2>
          </div>
          
          {data.clauses?.length > 0 ? (
            <div className="flex flex-col gap-4">
              {data.clauses.map((clause, idx) => (
                <ClauseCard key={clause._id || idx} clause={clause} />
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500">No clauses found for this document.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="text-center p-6 text-slate-400 text-sm bg-white border-t border-slate-200 mt-auto">
        &copy; {new Date().getFullYear()} LexAI. This document is shared securely.
      </footer>
    </div>
  );
};

export default SharePage;

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { ArrowLeft, Download, Share2, AlertTriangle, ShieldCheck, HelpCircle, FileText, Bot, FileWarning } from 'lucide-react';
import clsx from 'clsx';

export const ReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const res = await api.get(`/documents/${id}`);
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-16 h-16 bg-slate-200 rounded-full mb-4"></div>
          <div className="w-48 h-6 bg-slate-200 rounded mb-2"></div>
          <div className="w-32 h-4 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !data?.document) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center max-w-md">
          <FileWarning className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Failed to load report</h1>
          <p className="text-slate-500 text-sm mb-6">Could not fetch risk analysis data.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { document, clauses } = data;
  const score = document.riskScore || 1;
  const isHighRisk = score >= 8;
  const isMediumRisk = score >= 5 && score < 8;
  const riskColor = isHighRisk ? 'text-red-600' : isMediumRisk ? 'text-amber-600' : 'text-emerald-600';
  const riskBg = isHighRisk ? 'bg-red-50' : isMediumRisk ? 'bg-amber-50' : 'bg-emerald-50';
  const riskLabel = isHighRisk ? 'High Risk' : isMediumRisk ? 'Medium Risk' : 'Low Risk';

  // Find top concerns (high risk clauses)
  const highRiskClauses = clauses.filter(c => c.finalRiskLevel === 'high');
  const mediumRiskClauses = clauses.filter(c => c.finalRiskLevel === 'medium');
  const topConcerns = highRiskClauses.slice(0, 3);
  
  if (topConcerns.length < 3) {
    topConcerns.push(...mediumRiskClauses.slice(0, 3 - topConcerns.length));
  }

  const getRiskColorHex = (level) => {
    switch(level) {
      case 'high': return '#ef4444'; // red-500
      case 'medium': return '#f59e0b'; // amber-500
      case 'low': return '#10b981'; // emerald-500
      default: return '#cbd5e1';
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header - Excluded from print */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 print:hidden sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/document/${id}`)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-800" />
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <h1 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
            Risk Report
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/chat/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
          >
            <Bot className="w-4 h-4" /> Ask AI
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 print:p-0">
        <div className="max-w-5xl mx-auto space-y-8 print:space-y-6">
          
          {/* Print Header */}
          <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
            <h1 className="text-3xl font-bold text-slate-900">LexAI Risk Compliance Report</h1>
            <p className="text-slate-500 mt-2">Document: {document.fileName}</p>
            <p className="text-slate-500">Generated on: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk Gauge Card */}
            <div className="col-span-1 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Overall Risk Score</h2>
              
              <div className="relative w-48 h-48 mb-4">
                {/* Simple SVG Gauge */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" 
                    stroke={getRiskColorHex(isHighRisk ? 'high' : isMediumRisk ? 'medium' : 'low')} 
                    strokeWidth="8" 
                    strokeDasharray={`${(score / 10) * 283} 283`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={clsx("text-5xl font-black", riskColor)}>{score}</span>
                  <span className="text-slate-400 font-medium text-lg">/ 10</span>
                </div>
              </div>

              <div className={clsx("px-4 py-1.5 rounded-full text-sm font-bold shadow-sm mb-2", riskBg, riskColor, isHighRisk && 'bg-red-100', isMediumRisk && 'bg-amber-100', !isHighRisk && !isMediumRisk && 'bg-emerald-100')}>
                {riskLabel}
              </div>
              <p className="text-slate-500 text-xs font-medium">Based on {clauses.length} parsed clauses</p>
            </div>

            {/* Hybrid Breakdown Explanation */}
            <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="w-6 h-6 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-800">Hybrid Risk Analysis Engine</h2>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">
                LexAI calculates risk using a dual-engine approach. First, an AI model summarizes and scores the semantic intent of the clause. Then, a deterministic legal-dictionary engine scans for absolute liability keywords (e.g., "indemnify", "irrevocable"). The final risk score represents the highest threat level detected by either engine.
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-3xl font-black text-slate-800 mb-1">{highRiskClauses.length}</div>
                  <div className="text-xs font-bold text-red-500 uppercase tracking-wide">High Risk</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-3xl font-black text-slate-800 mb-1">{mediumRiskClauses.length}</div>
                  <div className="text-xs font-bold text-amber-500 uppercase tracking-wide">Medium Risk</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-3xl font-black text-slate-800 mb-1">{clauses.length - highRiskClauses.length - mediumRiskClauses.length}</div>
                  <div className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Low Risk</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Concerns */}
          {topConcerns.length > 0 && (
            <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm print:break-inside-avoid">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h2 className="text-lg font-bold text-slate-800">Top Priority Concerns</h2>
              </div>
              <div className="space-y-4">
                {topConcerns.map((clause, idx) => (
                  <div key={idx} className="p-5 bg-red-50/50 rounded-xl border border-red-100">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-800">{clause.clauseTitle}</h3>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded uppercase tracking-wider">
                        {clause.finalRiskLevel}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-3 leading-relaxed">{clause.simplifiedText}</p>
                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                      <FileWarning className="w-3.5 h-3.5 text-red-400" />
                      Reason: {clause.finalRiskReason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Lawyer Questions */}
          <div className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-sm print:break-inside-avoid bg-gradient-to-br from-indigo-50/50 to-white">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-6 h-6 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">Suggested Questions for your Lawyer</h2>
            </div>
            <ul className="space-y-3">
              {topConcerns.map((clause, idx) => (
                <li key={idx} className="flex gap-3 text-slate-700 text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 text-xs">{idx + 1}</div>
                  <span className="pt-0.5">Regarding <strong>{clause.clauseTitle}</strong>: How can we negotiate this to limit our liability given that it currently poses a {clause.finalRiskLevel} risk?</span>
                </li>
              ))}
              {topConcerns.length === 0 && (
                <li className="text-slate-500 italic text-sm">No critical questions suggested based on current low-risk profile.</li>
              )}
            </ul>
          </div>

          {/* Full Clause Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:break-before-page">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Complete Clause Analysis</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 w-1/4">Clause Title</th>
                    <th className="px-6 py-4 w-2/4">AI Summary & Assessment</th>
                    <th className="px-6 py-4 w-1/4 text-center">Risk Factors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clauses.map((clause, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 align-top">
                        <span className="font-semibold text-slate-800 block mb-1">{clause.clauseTitle}</span>
                        <span className="text-xs text-slate-400">Order: {clause.order}</span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <p className="text-slate-600 mb-2 leading-relaxed">{clause.simplifiedText}</p>
                        <p className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2">
                          {clause.finalRiskReason}
                        </p>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-col items-center gap-3">
                          <span className={clsx(
                            "px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider w-24 text-center",
                            clause.finalRiskLevel === 'high' ? 'bg-red-100 text-red-700' :
                            clause.finalRiskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          )}>
                            {clause.finalRiskLevel}
                          </span>
                          
                          {clause.triggeredKeywords?.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                              {clause.triggeredKeywords.map((kw, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-semibold border border-slate-200 uppercase tracking-wider">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
export default ReportPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { ArrowLeft, ArrowRightLeft, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { diffWordsWithSpace } from 'diff';
import clsx from 'clsx';

export const ComparePage = () => {
  const navigate = useNavigate();
  const [doc1Id, setDoc1Id] = useState('');
  const [doc2Id, setDoc2Id] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);

  // Fetch list of documents for dropdowns
  const { data: documents = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.get('/documents');
      return res.data;
    },
    select: (data) => data.filter(d => d.status === 'ready')
  });

  const handleCompare = async () => {
    if (!doc1Id || !doc2Id) return;
    setIsComparing(true);
    try {
      const [res1, res2] = await Promise.all([
        api.get(`/documents/${doc1Id}`),
        api.get(`/documents/${doc2Id}`)
      ]);

      const doc1 = res1.data;
      const doc2 = res2.data;

      const clauses1 = doc1.clauses || [];
      const clauses2 = doc2.clauses || [];

      // Simple matching algorithm by clauseTitle (case insensitive)
      const map1 = new Map(clauses1.map(c => [c.clauseTitle.toLowerCase(), c]));
      const map2 = new Map(clauses2.map(c => [c.clauseTitle.toLowerCase(), c]));

      const results = {
        doc1Name: doc1.document.fileName,
        doc2Name: doc2.document.fileName,
        added: [],
        removed: [],
        changed: [],
        unchanged: []
      };

      // Find Removed, Changed, Unchanged
      map1.forEach((c1, title) => {
        if (map2.has(title)) {
          const c2 = map2.get(title);
          // Compare simplified text to see if there's a difference
          if (c1.originalText !== c2.originalText) {
            results.changed.push({ oldClause: c1, newClause: c2 });
          } else {
            results.unchanged.push({ oldClause: c1, newClause: c2 });
          }
        } else {
          results.removed.push(c1);
        }
      });

      // Find Added
      map2.forEach((c2, title) => {
        if (!map1.has(title)) {
          results.added.push(c2);
        }
      });

      setComparisonResults(results);
    } catch (err) {
      console.error(err);
      alert('Error fetching documents for comparison.');
    } finally {
      setIsComparing(false);
    }
  };

  const renderDiffText = (oldText, newText) => {
    const diff = diffWordsWithSpace(oldText || '', newText || '');
    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {diff.map((part, index) => {
          if (part.added) return <span key={index} className="bg-emerald-200 text-emerald-900 px-0.5 rounded font-medium">{part.value}</span>;
          if (part.removed) return <span key={index} className="bg-red-200 text-red-900 line-through px-0.5 rounded opacity-70">{part.value}</span>;
          return <span key={index} className="text-slate-600">{part.value}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 z-10 sticky top-0 shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors group mr-4">
          <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-800" />
        </button>
        <h1 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
          Compare Documents
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Controls */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Select Documents to Compare</h2>
            <div className="flex flex-col md:flex-row items-end gap-6">
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Original Document</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={doc1Id}
                  onChange={e => setDoc1Id(e.target.value)}
                  disabled={isLoadingDocs}
                >
                  <option value="">Select original document...</option>
                  {documents.map(d => (
                    <option key={d._id} value={d._id}>{d.fileName}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-center p-2 rounded-full bg-slate-100 hidden md:flex shrink-0">
                <ArrowRightLeft className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Revised Document</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={doc2Id}
                  onChange={e => setDoc2Id(e.target.value)}
                  disabled={isLoadingDocs}
                >
                  <option value="">Select revised document...</option>
                  {documents.map(d => (
                    <option key={d._id} value={d._id}>{d.fileName}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleCompare}
                disabled={!doc1Id || !doc2Id || doc1Id === doc2Id || isComparing}
                className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 shrink-0 shadow-sm"
              >
                {isComparing ? 'Comparing...' : 'Compare Versions'}
              </button>
            </div>
            {doc1Id && doc2Id && doc1Id === doc2Id && (
              <p className="text-red-500 text-sm mt-3 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Please select two different documents to compare.
              </p>
            )}
          </div>

          {/* Results */}
          {comparisonResults && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-emerald-600">{comparisonResults.added.length}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 mt-1">Clauses Added</span>
                </div>
                <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-red-600">{comparisonResults.removed.length}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-700 mt-1">Clauses Removed</span>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-amber-600">{comparisonResults.changed.length}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 mt-1">Clauses Changed</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-slate-600">{comparisonResults.unchanged.length}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Unchanged</span>
                </div>
              </div>

              {/* Side-by-Side Changed Clauses */}
              {comparisonResults.changed.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    Modified Clauses
                  </h3>
                  {comparisonResults.changed.map((item, idx) => (
                    <div key={idx} className="bg-white border-l-4 border-l-amber-500 border-t border-r border-b border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                        <h4 className="font-bold text-slate-800">{item.oldClause.clauseTitle}</h4>
                        <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Modified</span>
                      </div>
                      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
                        <div className="flex-1 p-5 bg-red-50/20">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Original ({comparisonResults.doc1Name})</p>
                          <div className="text-sm text-slate-600">{item.oldClause.originalText}</div>
                        </div>
                        <div className="flex-1 p-5 bg-emerald-50/20">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Revised ({comparisonResults.doc2Name})</p>
                          <div className="text-sm">
                            {renderDiffText(item.oldClause.originalText, item.newClause.originalText)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Added Clauses */}
              {comparisonResults.added.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    New Clauses Added
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comparisonResults.added.map((clause, idx) => (
                      <div key={idx} className="bg-emerald-50/30 border border-emerald-200 rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-emerald-900">{clause.clauseTitle}</h4>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <p className="text-sm text-emerald-800/80 leading-relaxed line-clamp-4">{clause.originalText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Removed Clauses */}
              {comparisonResults.removed.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    Clauses Removed
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comparisonResults.removed.map((clause, idx) => (
                      <div key={idx} className="bg-red-50/30 border border-red-200 rounded-xl p-5 shadow-sm opacity-80">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-red-900 line-through decoration-red-300">{clause.clauseTitle}</h4>
                          <XCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-sm text-red-800/70 leading-relaxed line-clamp-3 line-through">{clause.originalText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {comparisonResults.changed.length === 0 && comparisonResults.added.length === 0 && comparisonResults.removed.length === 0 && (
                <div className="text-center p-16 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No differences found!</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">These two documents contain the exact same clauses and textual content.</p>
                </div>
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default ComparePage;

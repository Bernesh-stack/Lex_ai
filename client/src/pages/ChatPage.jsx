import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { ArrowLeft, Send, Bot, User, Trash2, FileText, Loader2, Sparkles } from 'lucide-react';
import clsx from 'clsx';

const StarterQuestions = [
  "What are the termination conditions?",
  "What is the governing law?",
  "Are there any penalty clauses?",
  "Summarize the payment terms."
];

export const ChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState('');

  // Fetch document details for the header
  const { data: documentData } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const res = await api.get(`/documents/${id}`);
      return res.data;
    }
  });

  // Fetch chat history
  const { data: messages = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['chat', id],
    queryFn: async () => {
      const res = await api.get(`/chat/${id}`);
      return res.data.data;
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mutation to send a message
  const chatMutation = useMutation({
    mutationFn: async (question) => {
      const res = await api.post(`/chat/${id}`, { question });
      return res.data.data;
    },
    onMutate: async (newQuestion) => {
      await queryClient.cancelQueries({ queryKey: ['chat', id] });
      const previousMessages = queryClient.getQueryData(['chat', id]);
      
      // Optimistically update UI
      queryClient.setQueryData(['chat', id], old => [
        ...old,
        { _id: 'temp-user', role: 'user', content: newQuestion, createdAt: new Date().toISOString() }
      ]);
      
      return { previousMessages };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['chat', id], old => {
        // Remove temp message and add actual ones
        const withoutTemp = old.filter(m => m._id !== 'temp-user');
        return [...withoutTemp, data.userMessage, data.assistantMessage];
      });
    },
    onError: (err, newQuestion, context) => {
      queryClient.setQueryData(['chat', id], context.previousMessages);
      alert('Failed to send message: ' + (err.response?.data?.message || err.message));
    }
  });

  // Mutation to clear chat
  const clearMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/chat/${id}`);
    },
    onSuccess: () => {
      queryClient.setQueryData(['chat', id], []);
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;
    chatMutation.mutate(input);
    setInput('');
  };

  const handleStarterQuestion = (q) => {
    if (chatMutation.isPending) return;
    chatMutation.mutate(q);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/document/${id}`)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-800" />
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-500" />
            <h1 className="font-semibold text-slate-800 text-lg">Ask AI</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {documentData?.document && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs font-medium text-slate-600 border border-slate-200">
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate max-w-[200px]">{documentData.document.fileName}</span>
            </div>
          )}
          <button 
            onClick={() => clearMutation.mutate()}
            disabled={messages.length === 0 || clearMutation.isPending}
            className="flex items-center gap-2 px-3 py-1.5 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Trash2 className="w-4 h-4" /> Clear Chat
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {isLoadingHistory ? (
            <div className="flex flex-col gap-6 w-full animate-pulse">
              <div className="flex gap-4 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                <div className="w-64 h-12 bg-slate-200 rounded-2xl rounded-tr-sm"></div>
              </div>
              <div className="flex gap-4 flex-row">
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                <div className="w-80 h-24 bg-slate-200 rounded-2xl rounded-tl-sm"></div>
              </div>
              <div className="flex gap-4 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                <div className="w-48 h-12 bg-slate-200 rounded-2xl rounded-tr-sm"></div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-16 pb-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border border-indigo-100">
                <Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Ask Anything</h2>
              <p className="text-slate-500 text-center max-w-md mb-8">
                I'm your AI legal assistant. Ask me questions about this document and I'll find the answers for you based strictly on its contents.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {StarterQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStarterQuestion(q)}
                    className="p-3 text-left bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md hover:text-indigo-700 transition-all text-sm font-medium text-slate-600 flex justify-between items-center group"
                  >
                    {q}
                    <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 rotate-135 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={msg._id || idx} className={clsx("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm", msg.role === 'user' ? "bg-slate-100 border-slate-200" : "bg-indigo-600 border-indigo-700")}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-slate-600" /> : <Bot className="w-5 h-5 text-white" />}
                </div>
                <div className={clsx("max-w-[80%] rounded-2xl p-4 shadow-sm", msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm")}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  
                  {/* Source citations */}
                  {msg.role === 'assistant' && msg.sourceChunks && msg.sourceChunks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Sources</p>
                      <div className="flex flex-col gap-2">
                        {msg.sourceChunks.slice(0, 2).map((chunk, i) => (
                          <div key={i} className="bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-500 line-clamp-2 italic">
                            "{chunk.content}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Typing Indicator */}
          {chatMutation.isPending && (
            <div className="flex gap-4 flex-row">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm bg-indigo-600 border-indigo-700">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-1.5 h-[52px]">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 z-10 shrink-0 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this document..."
            disabled={chatMutation.isPending}
            className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-sm shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-3 font-medium">AI can make mistakes. Please verify important information directly in the document.</p>
      </div>
    </div>
  );
};
export default ChatPage;

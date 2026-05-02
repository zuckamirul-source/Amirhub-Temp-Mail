'use client';

import { Suspense } from 'react';

import { useTempMail } from '@/hooks/use-temp-mail';
import { 
  Plus, 
  Inbox, 
  Star, 
  Clock, 
  Send, 
  Trash2, 
  RefreshCw, 
  Copy, 
  Check, 
  Search, 
  Menu,
  ChevronLeft,
  MoreVertical,
  ArrowLeft,
  Mail,
  Zap,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function TempGmailApp() {
  const {
    email,
    messages,
    isLoading,
    isRefreshing,
    generateNewEmail,
    selectMessage,
    activeMessageId,
    activeMessageContent,
    isMessageLoading,
    refreshInbox,
    clearActiveMessage,
    isOnline,
    error,
    lastChecked
  } = useTempMail();

  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (email) {
      navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white flex-col gap-4">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="text-blue-600"
        >
          <Loader2 className="w-12 h-12" />
        </motion.div>
        <div className="text-slate-500 font-medium animate-pulse">Initializing your secure inbox...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-50 font-sans overflow-hidden">
      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Utility Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6 h-max">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">A</div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">Amirhub</span>
            </div>
            <div className="w-px h-4 bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-1.5 font-medium text-xs text-slate-500 uppercase tracking-wider">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              {isOnline ? 'Active' : 'Offline'}
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={refreshInbox}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh Feed</span>
            </button>
            <button 
              onClick={generateNewEmail}
              className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
            >
              Get New Address
            </button>
          </div>
        </header>

        {/* View switching logic */}
        <AnimatePresence mode="wait">
          {!activeMessageId ? (
            <motion.div 
              key="inbox" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex-1 p-6 md:p-10 flex flex-col overflow-hidden"
            >
              {error && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-xl flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <span className="font-medium">{error}</span>
                  </div>
                  <button 
                    onClick={() => generateNewEmail()} 
                    className="bg-white text-red-600 px-4 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors font-bold text-sm shadow-xs"
                  >
                    Retry Connection
                  </button>
                </div>
              )}

              {/* Symmetrical Hero section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10 flex flex-col items-center mb-10 text-center shrink-0">
                <div className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-4">Current Temporary Email Address</div>
                <div 
                  onClick={copyToClipboard}
                  className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-xl border border-dashed border-slate-300 group cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <span className="text-xl md:text-3xl font-mono font-bold tracking-tight text-slate-800 break-all">{email}</span>
                  <button className="p-2 hover:bg-slate-200 rounded-md transition-colors shrink-0">
                    {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>
                <div className="mt-6 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">Auto-refresh every <span className="text-slate-900 font-bold">15s</span></span>
                    </div>
                    <button onClick={refreshInbox} className="text-sm font-semibold text-blue-600 hover:underline">Manual Sync</button>
                  </div>
                  {lastChecked && (
                    <div className="text-[10px] text-slate-400 font-medium">
                      Last checked: {lastChecked.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Grid Label */}
              <div className="flex items-center justify-between mb-4 px-2 shrink-0">
                <h2 className="text-lg font-bold text-slate-800">Incoming Messages</h2>
                <span className="text-xs text-slate-400 font-medium">Showing {messages.length} of {messages.length} messages</span>
              </div>

              {/* Data Grid Container */}
              <div className="geometric-card flex flex-col flex-1">
                {/* Grid Header */}
                <div className="data-grid-header grid-cols-[1.5fr,2fr,1fr] md:grid-cols-[1.5fr,2.5fr,1fr] hidden sm:grid">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sender</div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subject</div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Received</div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-12 text-center bg-slate-50/20">
                      <div className="text-slate-300 text-sm italic font-medium flex items-center gap-3">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Awaiting incoming packets...
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        onClick={() => selectMessage(msg.id)}
                        className="data-grid-row grid-cols-1 sm:grid-cols-[1.5fr,2fr,1fr] md:grid-cols-[1.5fr,2.5fr,1fr] gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                            {msg.from.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800 truncate">{msg.from}</span>
                        </div>
                        <div className="text-slate-600 text-sm md:text-base line-clamp-1 italic font-serif">
                          {msg.subject}
                        </div>
                        <div className="text-right text-xs md:text-sm text-slate-400 font-medium self-center">
                          {msg.date}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>


            </motion.div>
          ) : (
            <motion.div 
              key="detail" 
              initial={{ x: 50, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -50, opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Back navigation */}
              <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0">
                <button 
                  onClick={clearActiveMessage}
                  className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="font-bold text-slate-900 truncate">{activeMessageContent?.subject || 'Message Detail'}</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/30">
                {isMessageLoading || !activeMessageContent ? (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">
                    Loading content...
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                      <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                        <div>
                          <div className="font-bold text-slate-900">{activeMessageContent.from}</div>
                          <div className="text-xs text-slate-400">To: {email} • {activeMessageContent.date}</div>
                        </div>
                      </div>

                      <div className="prose prose-slate max-w-none prose-sm">
                        {activeMessageContent.htmlBody ? (
                          <div dangerouslySetInnerHTML={{ __html: activeMessageContent.htmlBody }} />
                        ) : (
                          <pre className="whitespace-pre-wrap font-sans text-slate-700">{activeMessageContent.body}</pre>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

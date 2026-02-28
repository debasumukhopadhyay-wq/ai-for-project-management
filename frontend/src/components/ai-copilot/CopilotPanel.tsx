'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCopilotStore } from '@/store/copilot.store';
import { aiApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_ACTIONS = [
  { label: 'Generate status report', prompt: 'Generate a status report for the current project' },
  { label: 'Analyze risks', prompt: 'Analyze and summarize the top risks' },
  { label: 'Cost anomalies', prompt: 'Are there any cost anomalies or budget overruns?' },
  { label: 'Schedule insights', prompt: 'What are the schedule performance insights?' },
];

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-sm font-bold text-gray-900 mb-2 mt-3 first:mt-0 border-b border-gray-200 pb-1">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold text-gray-800 mb-1.5 mt-3 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-gray-700 mb-1 mt-2 first:mt-0">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm text-gray-800 mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-0.5 text-sm text-gray-800">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-0.5 text-sm text-gray-800">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-gray-800 leading-relaxed">{children}</li>
        ),
        code: ({ inline, children }: any) =>
          inline ? (
            <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          ) : (
            <code className="block bg-gray-100 text-gray-800 p-2 rounded-md text-xs font-mono whitespace-pre-wrap my-1.5 overflow-x-auto">
              {children}
            </code>
          ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-brand-500 pl-3 italic text-gray-600 my-2 text-sm">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full text-xs border-collapse border border-gray-200 rounded">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
        th: ({ children }) => (
          <th className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-700">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-200 px-2 py-1 text-gray-800">{children}</td>
        ),
        hr: () => <hr className="border-gray-200 my-2" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function CopilotPanel() {
  const { isOpen, isLoading, messages, currentProjectId, closeCopilot, addMessage, setLoading, clearMessages } =
    useCopilotStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const query = text || input.trim();
    if (!query || isLoading) return;

    setInput('');
    addMessage({ role: 'user', content: query });
    setLoading(true);

    try {
      let response: any;

      if (currentProjectId && query.toLowerCase().includes('status report')) {
        response = await aiApi.generateStatusReport(currentProjectId);
      } else if (currentProjectId && query.toLowerCase().includes('risk')) {
        response = await aiApi.analyzeRisks(currentProjectId);
      } else if (currentProjectId && query.toLowerCase().includes('cost')) {
        response = await aiApi.detectCostAnomalies(currentProjectId);
      } else {
        response = await aiApi.query(query);
      }

      const content =
        typeof response?.data === 'string'
          ? response.data
          : response?.data?.report ||
            response?.data?.analysis ||
            response?.data?.response ||
            JSON.stringify(response?.data || response, null, 2);

      addMessage({ role: 'assistant', content });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'AI service unavailable. Check your API key.';
      toast.error(msg);
      addMessage({
        role: 'assistant',
        content: `**Error:** ${msg}`,
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white/70" />
          <span className="font-semibold text-sm">AI Copilot</span>
          {currentProjectId && (
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full text-white/80">
              Project context
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="p-1.5 rounded hover:bg-black/20 transition-colors text-white/70 hover:text-white text-xs"
            title="Clear chat"
          >
            Clear
          </button>
          <button onClick={closeCopilot} className="p-1.5 rounded hover:bg-black/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3 border border-brand-100">
              <Bot className="w-6 h-6 text-brand-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">AI Copilot ready</p>
            <p className="text-xs text-gray-500 mb-6">
              Ask me anything about your projects, programs, risks, or budgets.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 text-left mb-2">Quick actions:</p>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors text-gray-700"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                msg.role === 'user' ? 'bg-brand-600' : 'bg-white border border-gray-200',
              )}
            >
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5 text-white" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-brand-600" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                'max-w-[85%] rounded-xl px-3.5 py-2.5 shadow-sm',
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-200 rounded-tl-sm',
              )}
            >
              {msg.role === 'user' ? (
                <p className="text-sm text-white leading-relaxed">{msg.content}</p>
              ) : (
                <MarkdownMessage content={msg.content} />
              )}
              <p
                className={cn(
                  'text-[10px] mt-1.5',
                  msg.role === 'user' ? 'text-white/60 text-right' : 'text-gray-400',
                )}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask AI Copilot... (Enter to send)"
            className="flex-1 resize-none text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-28 min-h-[40px] bg-gray-50"
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

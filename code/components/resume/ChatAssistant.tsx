/**
 * AI Chat Assistant
 *
 * Floating chat widget that provides resume improvement suggestions.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { ResumeData } from '@/types';

interface ChatAssistantProps {
  resumeData: ResumeData;
  jobDescription?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SuggestionResponse {
  suggestions: string[];
  summary: string;
}

export default function ChatAssistant({ resumeData, jobDescription = '' }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I can help improve your resume. Ask me for suggestions or paste a section to refine.',
    },
  ]);
  const [autoSuggestions, setAutoSuggestions] = useState<SuggestionResponse | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastSnapshotRef = useRef<string>('');
  const suggestTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    const hasContent =
      Boolean(resumeData.personalInfo.fullName) ||
      Boolean(resumeData.personalInfo.summary) ||
      resumeData.experience.length > 0 ||
      resumeData.education.length > 0 ||
      resumeData.skills.technical.length + resumeData.skills.soft.length > 0;

    if (!hasContent) {
      setAutoSuggestions(null);
      return;
    }

    const snapshot = JSON.stringify({ resumeData, jobDescription });
    if (snapshot === lastSnapshotRef.current) return;
    lastSnapshotRef.current = snapshot;

    if (suggestTimerRef.current) {
      clearTimeout(suggestTimerRef.current);
    }

    suggestTimerRef.current = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const response = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeData, jobDescription }),
        });
        if (!response.ok) {
          throw new Error('Suggestion request failed');
        }
        const payload = (await response.json()) as SuggestionResponse;
        setAutoSuggestions(payload);
      } catch {
        // Keep last suggestions if the AI is unavailable
      } finally {
        setIsSuggesting(false);
      }
    }, 1500);

    return () => {
      if (suggestTimerRef.current) {
        clearTimeout(suggestTimerRef.current);
      }
    };
  }, [resumeData, jobDescription]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          resumeData,
          jobDescription,
          history: nextMessages.slice(-8),
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed (${response.status})`);
      }

      const payload = (await response.json()) as { reply: string; suggestions?: string[] };
      const suggestionBlock = payload.suggestions?.length
        ? `\n\nSuggestions:\n${payload.suggestions.map((item) => `- ${item}`).join('\n')}`
        : '';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `${payload.reply}${suggestionBlock}`,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I could not reach the AI service. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-30 no-print">
      {isOpen && (
        <div className="mb-3 w-[min(380px,90vw)] rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-200 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">AI Resume Assistant</div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              These are suggestions only. You decide what to use in your resume.
            </p>
          </div>

          <div className="border-b border-gray-100 px-3 py-2">
            <div className="text-xs font-semibold text-gray-700 mb-1">Live Suggestions</div>
            {isSuggesting && (
              <div className="text-xs text-gray-500">Checking your resume…</div>
            )}
            {!isSuggesting && autoSuggestions?.summary && (
              <p className="text-xs text-gray-600">{autoSuggestions.summary}</p>
            )}
            {!isSuggesting && autoSuggestions?.suggestions?.length ? (
              <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc list-inside">
                {autoSuggestions.suggestions.map((item, index) => (
                  <li key={`suggestion-${index}`}>{item}</li>
                ))}
              </ul>
            ) : null}
            {!isSuggesting && !autoSuggestions && (
              <p className="text-xs text-gray-500">Start editing your resume to get suggestions.</p>
            )}
            {autoSuggestions?.suggestions?.length ? (
              <button
                type="button"
                onClick={() => {
                  const text = autoSuggestions.suggestions.join('\n');
                  navigator.clipboard?.writeText(text);
                }}
                className="mt-2 text-xs text-primary-600 hover:text-primary-700"
              >
                Copy suggestions
              </button>
            ) : null}
          </div>

          <div ref={listRef} className="max-h-56 overflow-y-auto px-3 py-2 space-y-2">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-lg px-3 py-2 text-xs sm:text-sm whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-primary-50 text-primary-800 ml-6'
                    : 'bg-gray-50 text-gray-700 mr-6'
                }`}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="rounded-lg px-3 py-2 text-xs sm:text-sm bg-gray-50 text-gray-500 mr-6">
                Thinking…
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask for resume suggestions…"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="rounded-lg bg-primary-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full bg-primary-600 px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Open AI chat assistant"
      >
        💬 Chat
      </button>
    </div>
  );
}

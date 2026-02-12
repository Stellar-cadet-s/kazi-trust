'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { getToken } from '@/lib/auth';
import { chatService, type ChatJob, type JobMessageItem } from '@/services/api';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState<ChatJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [messages, setMessages] = useState<JobMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !getToken()) return;
    chatService
      .listChats()
      .then(setChats)
      .catch(() => setChats([]));
  }, [open]);

  useEffect(() => {
    if (selectedJobId == null || !getToken()) {
      setMessages([]);
      return;
    }
    setLoading(true);
    chatService
      .getMessages(selectedJobId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [selectedJobId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || selectedJobId == null || sending) return;
    setSending(true);
    setInput('');
    try {
      const msg = await chatService.sendMessage(selectedJobId, text);
      setMessages((prev) => [...prev, msg]);
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const selectedChat = chats.find((c) => c.job_id === selectedJobId);

  if (!getToken()) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center transition"
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[520px] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h3 className="font-semibold text-gray-900">Messages</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-1 min-h-0">
            {selectedJobId == null ? (
              <div className="flex-1 overflow-y-auto p-3">
                <p className="text-sm text-gray-500 mb-2">Chat about job location & coordination</p>
                {chats.length === 0 ? (
                  <p className="text-sm text-gray-500">No conversations yet. Assign or get assigned to a job to message.</p>
                ) : (
                  <ul className="space-y-1">
                    {chats.map((c) => (
                      <li key={c.job_id}>
                        <button
                          type="button"
                          onClick={() => setSelectedJobId(c.job_id)}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 transition"
                        >
                          <p className="font-medium text-gray-900 truncate">{c.job_title}</p>
                          <p className="text-xs text-gray-500">{c.other_name}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 flex flex-col min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedJobId(null)}
                    className="text-left px-3 py-2 border-b border-gray-100 text-sm text-blue-600 hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-900 truncate">{selectedChat?.job_title}</p>
                    <p className="text-xs text-gray-500">{selectedChat?.other_name}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loading ? (
                      <p className="text-sm text-gray-500">Loading...</p>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                              m.is_mine
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-900 rounded-bl-md'
                            }`}
                          >
                            {!m.is_mine && (
                              <p className="text-xs opacity-80 mb-0.5">{m.sender_name}</p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{m.text}</p>
                            <p className={`text-xs mt-1 ${m.is_mine ? 'text-blue-100' : 'text-gray-500'}`}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-3 border-t border-gray-200 flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Message (e.g. job address)..."
                      className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      aria-label="Send"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

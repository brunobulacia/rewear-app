'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { ChatMessage, Transaction, User } from '@/types';
import { ArrowLeft, Send, Shirt } from 'lucide-react';

const POLL_INTERVAL = 3000;

export default function ChatPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const router = useRouter();

  const [user, setUser]           = useState<User | null>(null);
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [tx, setTx]               = useState<Transaction | null>(null);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await api.get<ChatMessage[]>(`/messages/transaction/${transactionId}`);
      setMessages(msgs);
    } catch { /* silent poll error */ }
  }, [transactionId]);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored || !getStoredToken()) { router.push('/'); return; }
    setUser(stored);

    Promise.all([api.get<Transaction[]>('/transactions/mine'), fetchMessages()])
      .then(([txs]) => {
        const found = txs.find((t) => t.id === transactionId);
        if (!found) { router.push('/profile'); return; }
        setTx(found);
      })
      .catch(() => router.push('/profile'))
      .finally(() => setLoading(false));
  }, [transactionId, router, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const id = setInterval(fetchMessages, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchMessages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const msg = await api.post<ChatMessage>('/messages', { transactionId, content: trimmed });
      setMessages((prev) => [...prev, msg]);
      setText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tx || !user) return null;

  const other     = tx.buyer.id === user.id ? tx.seller : tx.buyer;
  const otherName = other.nombre || `${other.walletAddress.slice(0, 8)}...`;

  return (
    <div className="max-w-xl mx-auto w-full px-4 py-6">
      <div className="flex flex-col h-[72vh] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <Link href="/messages" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
          {otherName[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{otherName}</p>
          <p className="text-xs text-slate-400 truncate">{tx.garment.titulo}</p>
        </div>
        <Link href={`/garment/${tx.garment.id}`} className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
          {tx.garment.imagenes[0]
            ? <img src={tx.garment.imagenes[0]} alt={tx.garment.titulo} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Shirt className="w-4 h-4 text-slate-300" /></div>}
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-slate-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">Sin mensajes todavía</p>
            <p className="text-xs mt-1">Coordiná la entrega de la prenda con {otherName}.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escribí un mensaje..."
            rows={1}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none max-h-32 overflow-y-auto"
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
          <button onClick={handleSend} disabled={!text.trim() || sending}
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0">
            {sending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">Enter para enviar · Shift+Enter nueva línea</p>
      </div>
      </div>
    </div>
  );
}

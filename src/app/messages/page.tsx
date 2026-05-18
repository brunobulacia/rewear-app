'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getStoredToken, getStoredUser } from '@/lib/auth';
import { User } from '@/types';
import { MessageCircle, Shirt } from 'lucide-react';

interface InboxItem {
  transactionId: string;
  garment: { id: string; titulo: string; imagenes: string[] };
  otherUser: { id: string; nombre: string | null; walletAddress: string };
  lastMessage: {
    content: string;
    createdAt: string;
    sender: { id: string; nombre: string | null; walletAddress: string };
  } | null;
}

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser]       = useState<User | null>(null);
  const [inbox, setInbox]     = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored || !getStoredToken()) { router.push('/'); return; }
    setUser(stored);
    api.get<InboxItem[]>('/messages/inbox')
      .then(setInbox)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const formatTime = (iso: string) => {
    const d   = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mensajes</h1>
        <p className="text-slate-500 text-sm mt-1">Conversaciones con compradores y vendedores</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {inbox.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-7 text-slate-300" />
            </div>
            <p className="font-medium text-slate-600">No tenés conversaciones todavía</p>
            <p className="text-sm mt-1">Los chats se abren desde tus transacciones</p>
            <Link href="/profile" className="mt-4 text-sm text-indigo-600 hover:underline font-medium">
              Ver mis transacciones
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {inbox.map((item) => {
              const img     = item.garment.imagenes[0];
              const name    = item.otherUser.nombre || `${item.otherUser.walletAddress.slice(0, 8)}...`;
              const isMe    = item.lastMessage?.sender.id === user?.id;
              const preview = item.lastMessage
                ? `${isMe ? 'Vos: ' : ''}${item.lastMessage.content}`
                : 'Sin mensajes aún';

              return (
                <li key={item.transactionId}>
                  <Link href={`/chat/${item.transactionId}`}
                    className="flex items-center gap-4 px-4 py-4 hover:bg-slate-50 transition-colors">
                    <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-base shrink-0">
                      {name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-slate-900 text-sm truncate">{name}</span>
                        {item.lastMessage && (
                          <span className="text-xs text-slate-400 shrink-0 ml-2">{formatTime(item.lastMessage.createdAt)}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{preview}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{item.garment.titulo}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {img
                        ? <img src={img} alt={item.garment.titulo} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Shirt className="w-4 h-4 text-slate-300" /></div>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

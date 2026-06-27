'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { api } from '@/lib/api';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { Transaction } from '@/types';
import { ShieldOff, Users, Shirt, CheckCircle, ArrowRightLeft, AlertTriangle, ChevronRight } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalGarments: number;
  verifiedGarments: number;
  activeTransactions: number;
  completedTransactions: number;
  openDisputes: number;
}

interface Dispute {
  id: string;
  reason: string | null;
  createdAt: string;
  transaction: {
    id: string;
    garment: { id: string; titulo: string; imagenes: string[] };
    buyer:  { id: string; walletAddress: string; nombre: string | null };
    seller: { id: string; walletAddress: string; nombre: string | null };
  };
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: 'Comprado',     className: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Completado',  className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DISPUTED:  { label: 'En disputa',  className: 'bg-red-50 text-red-700 border-red-200' },
  REFUNDED:  { label: 'Reembolsado', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function AdminPage() {
  const { isConnected }   = useAccount();
  const user              = typeof window !== 'undefined' ? getStoredUser() : null;
  const token             = typeof window !== 'undefined' ? getStoredToken() : null;

  const [stats, setStats]         = useState<Stats | null>(null);
  const [transactions, setTxs]    = useState<Transaction[]>([]);
  const [disputes, setDisputes]   = useState<Dispute[]>([]);
  const [tab, setTab]             = useState<'overview' | 'transactions' | 'disputes'>('overview');
  const [resolving, setResolving] = useState<string | null>(null);
  const [mounted, setMounted]     = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!token) return;
    api.get<Stats>('/admin/stats').then(setStats).catch(() => {});
    api.get<Transaction[]>('/admin/transactions').then(setTxs).catch(() => {});
    api.get<Dispute[]>('/admin/disputes').then(setDisputes).catch(() => {});
  }, [token]);

  const handleResolve = async (transactionId: string, buyerWins: boolean) => {
    setResolving(`${transactionId}:${buyerWins ? 'buyer' : 'seller'}`);
    try {
      await api.patch(`/admin/disputes/${transactionId}/resolve`, { buyerWins });
      const [updatedDisputes, updatedStats] = await Promise.all([
        api.get<Dispute[]>('/admin/disputes'),
        api.get<Stats>('/admin/stats'),
      ]);
      setDisputes(updatedDisputes);
      setStats(updatedStats);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al resolver');
    } finally {
      setResolving(null);
    }
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isConnected || !user || !token) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">Necesitás iniciar sesión.</p>
      </div>
    );
  }

  if (user.rol !== 'ADMIN') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-red-200 rounded-xl p-8">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="font-semibold text-slate-900 mb-2">Acceso denegado</h2>
          <p className="text-slate-500 text-sm">Solo administradores pueden acceder a este panel.</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Usuarios',                 value: stats?.totalUsers,            icon: <Users className="w-4 h-4" />,          color: 'text-slate-900' },
    { label: 'Productos totales',          value: stats?.totalGarments,         icon: <Shirt className="w-4 h-4" />,          color: 'text-slate-900' },
    { label: 'Productos verificados',      value: stats?.verifiedGarments,      icon: <CheckCircle className="w-4 h-4" />,    color: 'text-indigo-600' },
    { label: 'Transacciones activas',    value: stats?.activeTransactions,    icon: <ArrowRightLeft className="w-4 h-4" />, color: 'text-blue-600' },
    { label: 'Transacciones completadas',value: stats?.completedTransactions, icon: <CheckCircle className="w-4 h-4" />,    color: 'text-emerald-600' },
    { label: 'Disputas abiertas',        value: stats?.openDisputes,          icon: <AlertTriangle className="w-4 h-4" />,  color: (stats?.openDisputes ?? 0) > 0 ? 'text-red-600' : 'text-slate-900' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
        <p className="text-slate-500 text-sm mt-1">Monitoreo del marketplace ReWear</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: 'overview',     label: 'Resumen' },
          { key: 'transactions', label: 'Transacciones' },
          { key: 'disputes',     label: disputes.length > 0 ? `Disputas (${disputes.length})` : 'Disputas' },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-400 mb-2">{s.icon}<p className="text-xs">{s.label}</p></div>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value ?? '—'}</p>
              </div>
            ))}
          </div>
          {disputes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-sm font-semibold">{disputes.length} disputa{disputes.length > 1 ? 's' : ''} pendiente{disputes.length > 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setTab('disputes')} className="flex items-center gap-1 text-xs text-red-600 font-medium hover:underline">
                Ver <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'transactions' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Últimas transacciones</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {transactions.length === 0 ? (
              <p className="px-6 py-10 text-center text-slate-400 text-sm">No hay transacciones.</p>
            ) : transactions.map((tx) => {
              const cfg = STATUS_LABELS[tx.status] || STATUS_LABELS.CONFIRMED;
              return (
                <div key={tx.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    {tx.garment.imagenes[0]
                      ? <img src={tx.garment.imagenes[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Shirt className="w-4 h-4 text-slate-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{tx.garment.titulo}</p>
                    <p className="text-xs text-slate-400">
                      {tx.buyer.nombre || shortAddr(tx.buyer.walletAddress)} → {tx.seller.nombre || shortAddr(tx.seller.walletAddress)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">{(tx.amountMatic ?? 0).toFixed(4)} ETH</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.className}`}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'disputes' && (
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm shadow-sm">No hay disputas pendientes.</div>
          ) : disputes.map((d) => {
            const tx = d.transaction;
            const isResolvingSeller = resolving === `${tx.id}:seller`;
            const isResolvingBuyer  = resolving === `${tx.id}:buyer`;
            const isResolving       = isResolvingSeller || isResolvingBuyer;
            return (
              <div key={d.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-red-50 border-b border-red-100 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700 text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Disputa abierta
                  </div>
                  <span className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleDateString('es-BO')}</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {tx.garment.imagenes[0]
                        ? <img src={tx.garment.imagenes[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Shirt className="w-4 h-4 text-slate-300" /></div>}
                    </div>
                    <div>
                      <Link href={`/garment/${tx.garment.id}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                        {tx.garment.titulo}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Comprador: <span className="font-medium">{tx.buyer.nombre || shortAddr(tx.buyer.walletAddress)}</span>
                        {' · '}
                        Vendedor: <span className="font-medium">{tx.seller.nombre || shortAddr(tx.seller.walletAddress)}</span>
                      </p>
                    </div>
                  </div>
                  {d.reason && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700">
                      <p className="text-xs text-slate-400 mb-1">Motivo:</p>{d.reason}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleResolve(tx.id, false)} disabled={isResolving}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                      {isResolvingSeller ? 'Procesando...' : 'Dar la razón al vendedor'}
                    </button>
                    <button onClick={() => handleResolve(tx.id, true)} disabled={isResolving}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                      {isResolvingBuyer ? 'Procesando...' : 'Reembolsar al comprador'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

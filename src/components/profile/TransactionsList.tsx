'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Transaction, TransactionStatus } from '@/types';
import { CheckCircle, AlertTriangle, MessageCircle, Star, Shirt } from 'lucide-react';

const STATUS_CONFIG: Record<TransactionStatus, { label: string; className: string }> = {
  CONFIRMED: { label: 'En camino',    className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  COMPLETED: { label: 'Completado',  className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  DISPUTED:  { label: 'En disputa',  className: 'bg-red-50 text-red-700 border border-red-200' },
  REFUNDED:  { label: 'Reembolsado', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
};

interface Rating { id: string; score: number; comment: string | null }
interface Props  { currentUserId: string }

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110">
          <Star className={`w-6 h-6 ${(hovered || value) >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

export function TransactionsList({ currentUserId }: Props) {
  const [transactions, setTransactions]   = useState<Transaction[]>([]);
  const [loading, setLoading]             = useState(true);
  const [tab, setTab]                     = useState<'compras' | 'ventas'>('compras');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [disputeId, setDisputeId]         = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [ratingId, setRatingId]           = useState<string | null>(null);
  const [ratingScore, setRatingScore]     = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratings, setRatings]             = useState<Record<string, Rating | null>>({});

  useEffect(() => {
    api.get<Transaction[]>('/transactions/mine')
      .then((txs) => {
        setTransactions(txs);
        txs.filter((t) => t.status === 'COMPLETED').forEach((t) => {
          api.get<Rating | null>(`/ratings/transaction/${t.id}`)
            .then((r) => setRatings((prev) => ({ ...prev, [t.id]: r })))
            .catch(() => {});
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const reload = () => {
    api.get<Transaction[]>('/transactions/mine').then(setTransactions).catch(() => {});
  };

  const handleConfirm = async (txId: string) => {
    setActionLoading(txId);
    try {
      await api.patch(`/transactions/${txId}/confirm`, { txHash: '' });
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al confirmar');
    } finally { setActionLoading(null); }
  };

  const handleDispute = async (txId: string) => {
    setActionLoading(txId);
    try {
      await api.patch(`/transactions/${txId}/dispute`, { txHash: disputeReason });
      setDisputeId(null); setDisputeReason(''); reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al abrir disputa');
    } finally { setActionLoading(null); }
  };

  const handleRating = async (txId: string) => {
    if (ratingScore === 0) return;
    setActionLoading(txId);
    try {
      const r = await api.post<Rating>('/ratings', {
        transactionId: txId, score: ratingScore, comment: ratingComment || undefined,
      });
      setRatings((prev) => ({ ...prev, [txId]: r }));
      setRatingId(null); setRatingScore(0); setRatingComment('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al calificar');
    } finally { setActionLoading(null); }
  };

  const compras = transactions.filter((t) => t.buyer.id === currentUserId);
  const ventas  = transactions.filter((t) => t.seller.id === currentUserId);
  const list    = tab === 'compras' ? compras : ventas;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Mis Transacciones</h3>
        <div className="flex gap-1 mt-3">
          {(['compras', 'ventas'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}>
              {t} ({t === 'compras' ? compras.length : ventas.length})
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No tenés {tab} todavía.</div>
        ) : (
          <div className="space-y-3">
            {list.map((tx) => {
              const img        = tx.garment.imagenes[0];
              const cfg        = STATUS_CONFIG[tx.status];
              const isBuyer    = tx.buyer.id === currentUserId;
              const canConfirm = isBuyer && tx.status === 'CONFIRMED';
              const canDispute = isBuyer && tx.status === 'CONFIRMED';
              const canRate    = isBuyer && tx.status === 'COMPLETED' && !ratings[tx.id];
              const rated      = ratings[tx.id];
              const isActing   = actionLoading === tx.id;

              return (
                <div key={tx.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {img
                        ? <img src={img} alt={tx.garment.titulo} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Shirt className="w-5 h-5 text-slate-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/garment/${tx.garment.id}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-600 truncate block transition-colors">
                        {tx.garment.titulo}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isBuyer
                          ? `Vendedor: ${tx.seller.nombre || tx.seller.walletAddress.slice(0, 8)}...`
                          : `Comprador: ${tx.buyer.nombre || tx.buyer.walletAddress.slice(0, 8)}...`}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {tx.amountMatic.toFixed(4)} POL · {new Date(tx.createdAt).toLocaleDateString('es-BO')}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium h-fit shrink-0 ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Rating existente */}
                  {rated && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-slate-600">
                      <div className="flex">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= rated.score ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        ))}
                      </div>
                      {rated.comment && <span className="text-slate-500">{rated.comment}</span>}
                    </div>
                  )}

                  {/* Chat */}
                  <Link href={`/chat/${tx.id}`}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors w-fit">
                    <MessageCircle className="w-3.5 h-3.5" /> Abrir chat
                  </Link>

                  {/* Acciones */}
                  {(canConfirm || canDispute) && (
                    <div className="flex gap-2 pt-1">
                      {canConfirm && (
                        <button onClick={() => handleConfirm(tx.id)} disabled={isActing}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-semibold transition-colors">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {isActing ? 'Procesando...' : 'Confirmar entrega'}
                        </button>
                      )}
                      {canDispute && (
                        <button onClick={() => setDisputeId(tx.id)} disabled={isActing}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 py-2 rounded-lg text-xs font-semibold transition-colors">
                          <AlertTriangle className="w-3.5 h-3.5" /> Disputar
                        </button>
                      )}
                    </div>
                  )}

                  {/* Botón calificar */}
                  {canRate && ratingId !== tx.id && (
                    <button onClick={() => setRatingId(tx.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 border border-amber-200 hover:bg-amber-50 text-amber-700 py-2 rounded-lg text-xs font-semibold transition-colors">
                      <Star className="w-3.5 h-3.5" /> Calificar al vendedor
                    </button>
                  )}

                  {/* Formulario calificación */}
                  {ratingId === tx.id && (
                    <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-semibold text-slate-700">Calificá al vendedor</p>
                      <StarSelector value={ratingScore} onChange={setRatingScore} />
                      <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Reseña opcional..." rows={2}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-white" />
                      <div className="flex gap-2">
                        <button onClick={() => handleRating(tx.id)} disabled={ratingScore === 0 || isActing}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-semibold transition-colors">
                          {isActing ? 'Enviando...' : 'Enviar calificación'}
                        </button>
                        <button onClick={() => { setRatingId(null); setRatingScore(0); setRatingComment(''); }}
                          className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-xs transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {tx.status === 'DISPUTED' && (
                    <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-red-700">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Disputa abierta — en revisión por la plataforma.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal disputa */}
      {disputeId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-slate-900 mb-1">Abrir disputa</h3>
            <p className="text-sm text-slate-500 mb-4">Describí el problema. La plataforma revisará el caso.</p>
            <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Ej: La prenda no coincide con las fotos del pasaporte NFT..." rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => handleDispute(disputeId)} disabled={!!actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                {actionLoading ? 'Enviando...' : 'Confirmar disputa'}
              </button>
              <button onClick={() => { setDisputeId(null); setDisputeReason(''); }}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 rounded-lg text-sm font-medium transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

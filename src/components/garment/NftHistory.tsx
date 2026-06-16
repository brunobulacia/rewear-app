'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, ArrowLeftRight, ExternalLink, Link2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface HistoryEvent {
  type: 'MINT' | 'TRANSFER';
  from: string;
  to: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmtDate = (ts: number) =>
  ts ? new Date(ts * 1000).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export function NftHistory({ garmentId, tokenId }: { garmentId: string; tokenId: string }) {
  const [events, setEvents] = useState<HistoryEvent[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/garments/${garmentId}/nft-history`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (alive) setEvents(d.events ?? []); })
      .catch(() => { if (alive) setEvents([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [garmentId]);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-900 px-4 py-2.5 flex items-center gap-2">
        <Link2 className="w-4 h-4 text-indigo-300 shrink-0" />
        <span className="text-xs font-semibold text-white uppercase tracking-wider">
          Historial on-chain · NFT #{tokenId}
        </span>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Consultando la blockchain…
          </div>
        ) : !events || events.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Sin transacciones registradas todavía.</p>
        ) : (
          <ol className="relative border-l-2 border-slate-100 ml-2 space-y-5">
            {events.map((e, i) => {
              const isMint = e.type === 'MINT';
              return (
                <li key={e.txHash + i} className="ml-4">
                  <span className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ${isMint ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                    {isMint ? <Sparkles className="w-2.5 h-2.5 text-white" /> : <ArrowLeftRight className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {isMint ? 'Pasaporte acuñado (mint)' : 'Transferencia de propiedad'}
                    </p>
                    <span className="text-xs text-slate-400 shrink-0">{fmtDate(e.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {isMint ? 'creado' : short(e.from)} <span className="text-slate-300">→</span> {short(e.to)}
                  </p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" /> {short(e.txHash)} · ver en Etherscan
                  </a>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

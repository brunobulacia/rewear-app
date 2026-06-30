import { Garment } from '@/types';
import Link from 'next/link';
import { ShieldCheck, Shirt } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';

const wearColors: Record<string, string> = {
  Excelente:   'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  'Muy bueno': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  Bueno:       'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
};

export function GarmentCard({ garment }: { garment: Garment }) {
  const imageUrl  = garment.imagenes[0];
  const wearLevel = garment.verification?.wearLevel;

  return (
    <Link href={`/garment/${garment.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
        <div className="relative h-56 bg-slate-100 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={garment.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shirt className="w-12 h-12 text-slate-300" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-1 rounded-full font-medium">
            <ShieldCheck className="w-3 h-3" />
            Verificado
          </div>
          {wearLevel && (
            <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-medium border ${wearColors[wearLevel] || 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
              {wearLevel}
            </div>
          )}
          <div className="absolute bottom-2 right-2">
            <FavoriteButton garmentId={garment.id} />
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
            {garment.titulo}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            {garment.marca && <span>{garment.marca}</span>}
            {garment.marca && garment.talla && <span>·</span>}
            {garment.talla && <span>Talla {garment.talla}</span>}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-slate-900">Bs. {garment.precio.toFixed(0)}</span>
            {garment.verification?.authenticityPct && (
              <span className="text-xs text-slate-400">
                {garment.verification.authenticityPct.toFixed(0)}% auténtico
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
              {garment.seller.nombre?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="truncate">
              {garment.seller.nombre || `${garment.seller.walletAddress.slice(0, 8)}...`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

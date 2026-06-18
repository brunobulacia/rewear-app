import { Star, ShoppingBag } from 'lucide-react';

interface Props {
  ratingAvg?: number | null;
  ratingCount?: number;
  salesCount?: number;
  className?: string;
}

/** Muestra la reputación de un vendedor: promedio de estrellas, nº de reseñas y ventas. */
export function ReputationBadge({ ratingAvg, ratingCount = 0, salesCount = 0, className = '' }: Props) {
  const hasRatings = ratingCount > 0 && ratingAvg != null;

  return (
    <div className={`flex items-center gap-3 text-xs ${className}`}>
      {hasRatings ? (
        <span className="inline-flex items-center gap-1 text-slate-600">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-slate-800">{ratingAvg.toFixed(1)}</span>
          <span className="text-slate-400">({ratingCount} reseña{ratingCount !== 1 ? 's' : ''})</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-slate-400">
          <Star className="w-3.5 h-3.5 text-slate-300" /> Sin reseñas aún
        </span>
      )}
      <span className="inline-flex items-center gap-1 text-slate-500">
        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
        {salesCount} venta{salesCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

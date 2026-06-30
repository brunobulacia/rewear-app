'use client';

import { useState, useRef, useCallback } from 'react';
import { Shirt, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

// Tintes del badge de estado, con variantes explícitas para modo oscuro.
const wearColors: Record<string, string> = {
  Excelente:   'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  'Muy bueno': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  Bueno:       'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
};

const arrowCls =
  'absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 dark:bg-slate-900/75 backdrop-blur-sm ' +
  'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center ' +
  'shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-white dark:hover:bg-slate-800 transition-opacity';

export function GarmentGallery({
  imagenes,
  titulo,
  wearLevel,
}: {
  imagenes: string[];
  titulo: string;
  wearLevel?: string | null;
}) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);

  const count = imagenes.length;
  const go = useCallback((d: number) => setIdx((i) => (i + d + count) % count), [count]);
  const current = imagenes[idx];

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <div className="lg:sticky lg:top-8">
      <div
        className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current ? (
          <img src={current} alt={`${titulo} ${idx + 1}`} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Shirt className="w-16 h-16 text-slate-300" />
          </div>
        )}

        {/* Badge Verificado */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-full font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> Verificado
        </div>

        {/* Badge de estado */}
        {wearLevel && (
          <div
            className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-medium border ${
              wearColors[wearLevel] ||
              'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {wearLevel}
          </div>
        )}

        {/* Controles del carousel (solo con más de una foto) */}
        {count > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Foto anterior" className={`${arrowCls} left-2`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Foto siguiente" className={`${arrowCls} right-2`}>
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Contador */}
            <div className="absolute bottom-3 right-3 bg-black/55 text-white text-xs px-2 py-0.5 rounded-full font-medium tabular-nums">
              {idx + 1} / {count}
            </div>

            {/* Indicadores (dots) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {imagenes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Ir a la foto ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

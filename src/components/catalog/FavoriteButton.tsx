'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { api } from '@/lib/api';
import { getStoredToken } from '@/lib/auth';

// Caché de IDs favoritos compartida entre todos los corazones (1 request por sesión).
let favIdsCache: Promise<Set<string>> | null = null;
function loadFavIds(): Promise<Set<string>> {
  if (!getStoredToken()) return Promise.resolve(new Set());
  if (!favIdsCache) {
    favIdsCache = api
      .get<string[]>('/favorites/ids')
      .then((ids) => new Set(ids))
      .catch(() => new Set<string>());
  }
  return favIdsCache;
}
/** Permite que otras vistas (ej. /favorites) invaliden la caché. */
export function resetFavCache() {
  favIdsCache = null;
}

export function FavoriteButton({ garmentId, size = 'md' }: { garmentId: string; size?: 'sm' | 'md' }) {
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadFavIds().then((s) => setFav(s.has(garmentId)));
  }, [garmentId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!getStoredToken()) {
      alert('Conectá tu billetera e iniciá sesión para guardar favoritos.');
      return;
    }
    setBusy(true);
    try {
      const { favorited } = await api.post<{ favorited: boolean }>(`/favorites/${garmentId}`, {});
      setFav(favorited);
      const s = await loadFavIds();
      if (favorited) s.add(garmentId);
      else s.delete(garmentId);
    } catch {
      /* noop */
    } finally {
      setBusy(false);
    }
  };

  const dim = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const icon = size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      aria-pressed={fav}
      className={`${dim} flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-60`}
    >
      <Heart className={`${icon} transition-colors ${fav ? 'fill-red-500 text-red-500' : 'text-slate-500 dark:text-slate-300'}`} />
    </button>
  );
}

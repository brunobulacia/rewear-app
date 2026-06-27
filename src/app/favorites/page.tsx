'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { api } from '@/lib/api';
import { getStoredToken } from '@/lib/auth';
import { Garment } from '@/types';
import { GarmentCard } from '@/components/catalog/GarmentCard';
import { Heart, Loader2 } from 'lucide-react';

export default function FavoritesPage() {
  const { isConnected } = useAccount();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!getStoredToken()) { setLoading(false); return; }
    api.get<Garment[]>('/favorites/mine')
      .then(setGarments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isConnected || !getStoredToken()) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-10 shadow-sm">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Conectá tu billetera</h2>
          <p className="text-slate-500 text-sm">Iniciá sesión para ver y guardar tus productos favoritos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold text-slate-900">Mis Favoritos</h1>
      </div>
      <p className="text-slate-500 text-sm mb-6">Los productos que guardaste para no perderlas de vista.</p>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : garments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-slate-500 text-sm">Todavía no guardaste ningún producto.</p>
          <Link href="/catalog" className="mt-2 inline-block text-sm text-indigo-600 hover:underline font-medium">
            Explorar el catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {garments.map((g) => (
            <GarmentCard key={g.id} garment={g} />
          ))}
        </div>
      )}
    </div>
  );
}

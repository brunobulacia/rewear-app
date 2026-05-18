'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { GarmentDetail } from '@/types';
import { ShieldCheck, Lock, ArrowLeft, ChevronRight, Shirt } from 'lucide-react';

const BOB_PER_MATIC = parseFloat(process.env.NEXT_PUBLIC_BOB_PER_MATIC || '3.5');

function CartContent() {
  const searchParams = useSearchParams();
  const garmentId    = searchParams.get('garmentId');

  const [garment, setGarment] = useState<GarmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!garmentId) { setLoading(false); return; }
    api.get<GarmentDetail>(`/garments/${garmentId}`)
      .then(setGarment)
      .catch(() => setError('No se pudo cargar la prenda.'))
      .finally(() => setLoading(false));
  }, [garmentId]);

  if (!garmentId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 mb-4">Tu carrito está vacío.</p>
        <Link href="/catalog" className="text-indigo-600 hover:underline text-sm">Ver catálogo</Link>
      </div>
    );
  }

  if (loading) return <div className="max-w-lg mx-auto px-4 py-16 text-center text-slate-400 text-sm">Cargando...</div>;

  if (error || !garment) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-red-500 mb-4">{error || 'Prenda no encontrada.'}</p>
        <Link href="/catalog" className="text-indigo-600 hover:underline text-sm">Volver al catálogo</Link>
      </div>
    );
  }

  if (garment.estado !== 'VERIFIED') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium mb-2">Esta prenda no está disponible</p>
        <p className="text-slate-500 text-sm mb-4">
          {garment.estado === 'SOLD' ? 'Ya fue vendida.' : 'No está verificada aún.'}
        </p>
        <Link href="/catalog" className="text-indigo-600 hover:underline text-sm">Ver otras prendas</Link>
      </div>
    );
  }

  const maticAmount = (garment.precio / BOB_PER_MATIC).toFixed(4);
  const mainImage   = garment.imagenes[0];
  const shortAddr   = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/catalog" className="hover:text-indigo-600 transition-colors">Catálogo</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/garment/${garment.id}`} className="hover:text-indigo-600 transition-colors truncate max-w-40">{garment.titulo}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700">Carrito</span>
      </nav>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tu Carrito</h1>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Item */}
        <div className="flex gap-4 p-5">
          <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
            {mainImage
              ? <img src={mainImage} alt={garment.titulo} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Shirt className="w-8 h-8 text-slate-300" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            {garment.categoria && (
              <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-0.5">{garment.categoria}</p>
            )}
            <h2 className="font-semibold text-slate-900 truncate">{garment.titulo}</h2>
            {garment.marca && (
              <p className="text-sm text-slate-500">{garment.marca}{garment.talla ? ` · Talla ${garment.talla}` : ''}</p>
            )}
            <div className="mt-1.5 flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full w-fit font-medium">
              <ShieldCheck className="w-3 h-3" /> Verificado
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-slate-900">Bs. {garment.precio.toFixed(0)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{maticAmount} POL</p>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Vendedor */}
        <div className="px-5 py-3 flex items-center gap-3 bg-slate-50">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
            {garment.seller.nombre?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-xs text-slate-400">Vendedor</p>
            <p className="text-sm font-medium text-slate-900">
              {garment.seller.nombre || shortAddr(garment.seller.walletAddress)}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Resumen */}
        <div className="px-5 py-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Precio de la prenda</span>
            <span>Bs. {garment.precio.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Comisión de plataforma (2.5%)</span>
            <span>Bs. {(garment.precio * 0.025).toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900 text-base">
            <span>Total (en cripto)</span>
            <span>{maticAmount} POL</span>
          </div>
          <p className="text-xs text-slate-400">1 POL ≈ Bs. {BOB_PER_MATIC.toFixed(2)} (referencial)</p>
        </div>

        {/* Escrow info */}
        <div className="mx-5 mb-4 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
          <div className="flex items-start gap-2 text-indigo-700">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold mb-1">Pago protegido por escrow inteligente</p>
              <p>Los fondos se retienen en el contrato hasta que confirmes la entrega. Podés abrir una disputa si hay algún problema.</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="px-5 pb-5 space-y-2">
          <Link
            href={`/checkout/${garment.id}`}
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Continuar al pago
          </Link>
          <Link
            href={`/garment/${garment.id}`}
            className="flex items-center justify-center gap-1.5 w-full text-sm text-slate-500 hover:text-slate-700 transition-colors py-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a la prenda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-16 text-center text-slate-400 text-sm">Cargando...</div>}>
      <CartContent />
    </Suspense>
  );
}

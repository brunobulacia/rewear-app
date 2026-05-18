import Link from 'next/link';
import { GarmentCard } from '@/components/catalog/GarmentCard';
import { Garment, PaginatedResponse } from '@/types';
import { ShieldCheck, Layers, Lock, ArrowRight, Bot } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchLatestGarments(): Promise<Garment[]> {
  try {
    const res = await fetch(`${API_BASE}/garments?limit=6`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error();
    const data: PaginatedResponse<Garment> = await res.json();
    return data.data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const garments = await fetchLatestGarments();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-white border-b border-slate-200 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-100 mb-6">
            Moda circular · Verificada con IA · Blockchain
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-5 leading-tight tracking-tight">
            Comprá y vendé ropa de segunda mano<br />
            <span className="text-indigo-600">con autenticidad garantizada.</span>
          </h1>
          <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
            Cada prenda verificada por IA, tokenizada como NFT y protegida por escrow en Polygon.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-lg font-semibold transition-colors"
            >
              Explorar catálogo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-7 py-3 rounded-lg font-semibold transition-colors"
            >
              Publicar prenda
            </Link>
          </div>
        </div>
      </section>

      {/* Prendas recientes */}
      {garments.length > 0 && (
        <section className="py-14 px-4 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Últimas prendas verificadas</h2>
                <p className="text-slate-500 text-sm mt-1">Pasaporte digital en Polygon para cada una</p>
              </div>
              <Link href="/catalog" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {garments.map((g) => <GarmentCard key={g.id} garment={g} />)}
            </div>
          </div>
        </section>
      )}

      {/* Cómo funciona */}
      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">¿Cómo funciona ReWear?</h2>
            <p className="text-slate-500 text-sm mt-2">Tres pasos para una compra segura y trazable</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Bot className="w-6 h-6 text-indigo-600" />,
                title: 'Verificación IA',
                desc: 'Nuestra IA analiza las fotos de cada prenda para verificar su autenticidad y evaluar el nivel de desgaste.',
              },
              {
                icon: <Layers className="w-6 h-6 text-indigo-600" />,
                title: 'Pasaporte NFT',
                desc: 'Cada prenda aprobada recibe un pasaporte digital inmutable en Polygon. El historial es público y verificable.',
              },
              {
                icon: <Lock className="w-6 h-6 text-indigo-600" />,
                title: 'Pago con Escrow',
                desc: 'Los fondos quedan en custodia hasta que confirmás la recepción. Sin intermediarios, sin riesgo.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA vender */}
      <section className="bg-indigo-600 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold text-white mb-3">
            ¿Tenés ropa que ya no usás?
          </h2>
          <p className="text-indigo-200 text-sm mb-6">
            Publicala gratis. La IA la verifica y genera un pasaporte NFT automáticamente.
          </p>
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Publicar una prenda <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

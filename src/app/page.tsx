import Link from 'next/link';
import { GarmentCard } from '@/components/catalog/GarmentCard';
import { Garment, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchLatestGarments(): Promise<Garment[]> {
  try {
    const res = await fetch(`${API_BASE}/garments?limit=6`, {
      next: { revalidate: 60 },
    });
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
      <section className="bg-linear-to-br from-emerald-600 to-emerald-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Moda circular.<br />
            <span className="text-emerald-200">Verificada y trazable.</span>
          </h1>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
            Compra y vende ropa de segunda mano con autenticidad verificada por IA y
            trazabilidad inmutable en blockchain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/catalog"
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Explorar catálogo
            </Link>
            <Link
              href="/sell"
              className="border-2 border-white text-white hover:bg-emerald-700 px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Vender una prenda
            </Link>
          </div>
        </div>
      </section>

      {/* Prendas recientes */}
      {garments.length > 0 && (
        <section className="py-14 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Últimas prendas verificadas</h2>
                <p className="text-gray-500 text-sm mt-1">Cada una con pasaporte digital en Polygon</p>
              </div>
              <Link href="/catalog" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                Ver todas →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {garments.map((g) => (
                <GarmentCard key={g.id} garment={g} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className={`py-16 px-4 ${garments.length > 0 ? 'bg-gray-50' : ''}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            ¿Cómo funciona ReWear?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verificación IA</h3>
              <p className="text-gray-500 text-sm">
                Nuestra IA analiza las fotos de cada prenda para verificar su autenticidad
                y evaluar el nivel de desgaste.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⛓️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Pasaporte NFT</h3>
              <p className="text-gray-500 text-sm">
                Cada prenda aprobada recibe un pasaporte digital inmutable en Polygon.
                El historial es público y verificable.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Pago Seguro (Escrow)</h3>
              <p className="text-gray-500 text-sm">
                Los fondos quedan en custodia hasta que confirmas la recepción.
                Sin intermediarios, sin riesgo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA vender */}
      <section className="bg-emerald-700 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold text-white mb-3">
            ¿Tenés ropa que ya no usás?
          </h2>
          <p className="text-emerald-100 text-sm mb-6">
            Publicala gratis. La IA la verifica y le genera un pasaporte NFT automáticamente.
          </p>
          <Link
            href="/sell"
            className="inline-block bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-3 rounded-full font-semibold transition-colors"
          >
            Publicar una prenda
          </Link>
        </div>
      </section>
    </div>
  );
}

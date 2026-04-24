import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GarmentDetail } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const wearColors: Record<string, string> = {
  Excelente: 'bg-green-100 text-green-700',
  'Muy bueno': 'bg-blue-100 text-blue-700',
  Bueno: 'bg-yellow-100 text-yellow-700',
};

async function fetchGarment(id: string): Promise<GarmentDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/garments/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch {
    return null;
  }
}

export default async function GarmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const garment = await fetchGarment(id);

  if (!garment) notFound();

  const mainImage =
    garment.imagenes[0] ||
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800';

  const wearLevel = garment.verification?.wearLevel;
  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500 flex items-center gap-2">
        <Link href="/catalog" className="hover:text-emerald-600 transition-colors">
          Catálogo
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-[200px]">{garment.titulo}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imágenes */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={mainImage}
              alt={garment.titulo}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                ✓ Verificado
              </span>
              {wearLevel && (
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${wearColors[wearLevel] || 'bg-gray-100 text-gray-700'}`}
                >
                  {wearLevel}
                </span>
              )}
            </div>
          </div>
          {/* Miniaturas */}
          {garment.imagenes.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {garment.imagenes.slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={img}
                    alt={`${garment.titulo} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          {/* Título y precio */}
          <div>
            {garment.categoria && (
              <span className="text-xs text-emerald-600 font-medium uppercase tracking-wide">
                {garment.categoria}
              </span>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{garment.titulo}</h1>
            <p className="text-3xl font-bold text-emerald-600 mt-2">
              Bs. {garment.precio.toFixed(0)}
            </p>
          </div>

          {/* Detalles básicos */}
          <div className="grid grid-cols-2 gap-3">
            {garment.marca && (
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Marca</p>
                <p className="text-sm font-semibold text-gray-900">{garment.marca}</p>
              </div>
            )}
            {garment.talla && (
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Talla</p>
                <p className="text-sm font-semibold text-gray-900">{garment.talla}</p>
              </div>
            )}
            {garment.estilo && (
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Estilo</p>
                <p className="text-sm font-semibold text-gray-900">{garment.estilo}</p>
              </div>
            )}
          </div>

          {/* Descripción */}
          {garment.descripcion && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Descripción</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{garment.descripcion}</p>
            </div>
          )}

          {/* Verificación IA */}
          {garment.verification && (
            <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Dictamen de Verificación IA
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {garment.verification.authenticityPct !== null && (
                  <div>
                    <p className="text-xs text-emerald-700">Autenticidad</p>
                    <p className="text-lg font-bold text-emerald-900">
                      {garment.verification.authenticityPct.toFixed(0)}%
                    </p>
                  </div>
                )}
                {garment.verification.aiScore !== null && (
                  <div>
                    <p className="text-xs text-emerald-700">Score IA</p>
                    <p className="text-lg font-bold text-emerald-900">
                      {garment.verification.aiScore.toFixed(1)}
                    </p>
                  </div>
                )}
                {wearLevel && (
                  <div>
                    <p className="text-xs text-emerald-700">Estado</p>
                    <p className="text-sm font-semibold text-emerald-900">{wearLevel}</p>
                  </div>
                )}
              </div>
              {garment.verification.dictamen && (
                <p className="text-xs text-emerald-800 leading-relaxed border-t border-emerald-200 pt-3">
                  {garment.verification.dictamen}
                </p>
              )}
            </div>
          )}

          {/* NFT */}
          {garment.nftTokenId && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>NFT Token ID: </span>
              <span className="font-mono text-gray-700">{garment.nftTokenId}</span>
            </div>
          )}

          {/* Vendedor */}
          <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
              {garment.seller.nombre?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Vendedor</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {garment.seller.nombre || shortAddress(garment.seller.walletAddress)}
              </p>
              <p className="text-xs text-gray-400 font-mono">
                {shortAddress(garment.seller.walletAddress)}
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            disabled
            title="Disponible en Sprint 2"
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm opacity-50 cursor-not-allowed"
          >
            Comprar — Próximamente
          </button>
          <p className="text-xs text-center text-gray-400">
            El sistema de pagos con escrow estará disponible en la próxima versión.
          </p>
        </div>
      </div>
    </div>
  );
}

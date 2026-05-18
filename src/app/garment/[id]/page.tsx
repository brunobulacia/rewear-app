import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GarmentDetail } from '@/types';
import { ShieldCheck, Layers, ChevronRight, Shirt, Bot, ExternalLink, User } from 'lucide-react';

const API_BASE      = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const NFT_CONTRACT  = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

const wearColors: Record<string, string> = {
  Excelente:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Muy bueno': 'bg-blue-50 text-blue-700 border-blue-200',
  Bueno:       'bg-amber-50 text-amber-700 border-amber-200',
};

async function fetchGarment(id: string): Promise<GarmentDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/garments/${id}`, { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return null;
  }
}

export default async function GarmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params;
  const garment  = await fetchGarment(id);

  if (!garment) notFound();

  const mainImage = garment.imagenes[0];
  const wearLevel = garment.verification?.wearLevel;
  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/catalog" className="hover:text-indigo-600 transition-colors">Catálogo</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 truncate max-w-52">{garment.titulo}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imágenes */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden">
            {mainImage ? (
              <img src={mainImage} alt={garment.titulo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Shirt className="w-16 h-16 text-slate-300" />
              </div>
            )}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Verificado
            </div>
            {wearLevel && (
              <div className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-medium border ${wearColors[wearLevel] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {wearLevel}
              </div>
            )}
          </div>
          {garment.imagenes.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {garment.imagenes.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <img src={img} alt={`${garment.titulo} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            {garment.categoria && (
              <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                {garment.categoria}
              </span>
            )}
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{garment.titulo}</h1>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              Bs. {garment.precio.toFixed(0)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {garment.marca && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-400 mb-0.5">Marca</p>
                <p className="text-sm font-semibold text-slate-900">{garment.marca}</p>
              </div>
            )}
            {garment.talla && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-400 mb-0.5">Talla</p>
                <p className="text-sm font-semibold text-slate-900">{garment.talla}</p>
              </div>
            )}
            {garment.estilo && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-400 mb-0.5">Estilo</p>
                <p className="text-sm font-semibold text-slate-900">{garment.estilo}</p>
              </div>
            )}
          </div>

          {garment.descripcion && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Descripción</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{garment.descripcion}</p>
            </div>
          )}

          {/* Verificación IA */}
          {garment.verification && (
            <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4" /> Dictamen de Verificación IA
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {garment.verification.authenticityPct !== null && (
                  <div>
                    <p className="text-xs text-indigo-600">Autenticidad</p>
                    <p className="text-lg font-bold text-indigo-900">{garment.verification.authenticityPct.toFixed(0)}%</p>
                  </div>
                )}
                {garment.verification.aiScore !== null && (
                  <div>
                    <p className="text-xs text-indigo-600">Score IA</p>
                    <p className="text-lg font-bold text-indigo-900">{garment.verification.aiScore.toFixed(1)}</p>
                  </div>
                )}
                {wearLevel && (
                  <div>
                    <p className="text-xs text-indigo-600">Estado</p>
                    <p className="text-sm font-semibold text-indigo-900">{wearLevel}</p>
                  </div>
                )}
              </div>
              {garment.verification.dictamen && (
                <p className="text-xs text-indigo-800 leading-relaxed border-t border-indigo-200 pt-3">
                  {garment.verification.dictamen}
                </p>
              )}
            </div>
          )}

          {/* Pasaporte digital — ID único + NFT Token */}
          <div className="border border-indigo-200 bg-white rounded-xl overflow-hidden">
            <div className="bg-indigo-600 px-4 py-2.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-200 shrink-0" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">Pasaporte Digital</span>
            </div>
            <div className="px-4 py-3 space-y-3">
              {/* ID único de la prenda — siempre visible */}
              <div>
                <p className="text-xs text-slate-400 mb-1">Identificador único de prenda</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="font-mono text-xs text-slate-700 break-all select-all">{garment.id}</span>
                </div>
              </div>
              {/* Token NFT — solo si fue minteado */}
              {garment.nftTokenId && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Token NFT en blockchain</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-bold text-indigo-700">#{garment.nftTokenId}</span>
                    {NFT_CONTRACT && (
                      <a
                        href={`https://sepolia.etherscan.io/token/${NFT_CONTRACT}?a=${garment.nftTokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver en blockchain
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vendedor */}
          <Link
            href={`/seller/${garment.seller.id}`}
            className="flex items-center gap-3 border border-slate-200 hover:border-indigo-300 rounded-xl px-4 py-3 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
              {garment.seller.nombre?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400">Vendedor</p>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 truncate transition-colors">
                {garment.seller.nombre || shortAddr(garment.seller.walletAddress)}
              </p>
              <p className="text-xs text-slate-400 font-mono">{shortAddr(garment.seller.walletAddress)}</p>
            </div>
            <User className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
          </Link>

          {/* CTA */}
          {garment.estado === 'VERIFIED' ? (
            <Link
              href={`/cart?garmentId=${garment.id}`}
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Comprar con escrow
            </Link>
          ) : (
            <button disabled className="w-full bg-slate-100 text-slate-400 py-3 rounded-xl font-semibold text-sm cursor-not-allowed">
              {garment.estado === 'SOLD' ? 'Prenda vendida' : 'No disponible'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

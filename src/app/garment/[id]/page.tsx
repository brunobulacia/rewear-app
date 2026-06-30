import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { GarmentDetail } from '@/types';
import { categoriaLabel } from '@/lib/categoria';
import { ShieldCheck, Layers, ChevronRight, Bot, ExternalLink, ShoppingBag, Lock } from 'lucide-react';
import { NftHistory } from '@/components/garment/NftHistory';
import { GarmentGallery } from '@/components/garment/GarmentGallery';
import { ReputationBadge } from '@/components/ReputationBadge';

const API_BASE      = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const NFT_CONTRACT  = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

/** Tarjeta con un estilo consistente para todas las secciones de confianza. */
function SectionCard({ icon, title, subtitle, children }: {
  icon: ReactNode; title: string; subtitle?: string; children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <header className="flex items-center gap-2.5 mb-4">
        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">{icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Attr({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 min-w-[90px] rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
    </div>
  );
}

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

  const wearLevel = garment.verification?.wearLevel;
  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/catalog" className="hover:text-indigo-600 transition-colors">Catálogo</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 truncate max-w-52">{garment.titulo}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Imágenes — carousel */}
        <GarmentGallery imagenes={garment.imagenes} titulo={garment.titulo} wearLevel={wearLevel} />

        {/* Info */}
        <div className="flex flex-col gap-5">
          {/* Encabezado */}
          <div>
            {garment.categoria && (
              <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                {categoriaLabel(garment.categoria)}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 leading-tight">{garment.titulo}</h1>
          </div>

          {/* Compra */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Precio</p>
                <p className="text-3xl font-bold text-slate-900">Bs. {garment.precio.toFixed(0)}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Verificada
              </span>
            </div>
            {garment.estado === 'VERIFIED' ? (
              <Link
                href={`/cart?garmentId=${garment.id}`}
                className="mt-4 flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                <ShoppingBag className="w-4 h-4" /> Comprar con escrow
              </Link>
            ) : (
              <button disabled className="mt-4 w-full bg-slate-100 text-slate-400 py-3 rounded-xl font-semibold text-sm cursor-not-allowed">
                {garment.estado === 'SOLD' ? 'Producto vendido' : 'No disponible'}
              </button>
            )}
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Lock className="w-3 h-3" /> Pago retenido en blockchain hasta confirmar la entrega
            </p>
          </div>

          {/* Atributos */}
          {(garment.marca || garment.modelo || garment.colorway || garment.talla || garment.estilo || garment.condicion) && (
            <div className="flex flex-wrap gap-2.5">
              {garment.marca && <Attr label="Marca" value={garment.marca} />}
              {garment.modelo && <Attr label="Modelo" value={garment.modelo} />}
              {garment.colorway && <Attr label="Colorway" value={garment.colorway} />}
              {garment.talla && <Attr label="Talla" value={garment.talla} />}
              {garment.estilo && <Attr label="Estilo" value={garment.estilo} />}
              {garment.condicion && <Attr label="Condición" value={garment.condicion} />}
            </div>
          )}

          {/* Descripción */}
          {garment.descripcion && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Descripción</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{garment.descripcion}</p>
            </div>
          )}

          {/* Vendedor */}
          <Link
            href={`/seller/${garment.seller.id}`}
            className="group rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm bg-white p-4 flex items-center gap-4 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
              {garment.seller.nombre?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400">Vendedor</p>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 truncate transition-colors">
                {garment.seller.nombre || shortAddr(garment.seller.walletAddress)}
              </p>
              <ReputationBadge
                ratingAvg={garment.seller.ratingAvg}
                ratingCount={garment.seller.ratingCount}
                salesCount={garment.seller.salesCount}
                className="mt-1"
              />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
          </Link>
        </div>
      </div>

      {/* Autenticidad y trazabilidad — grilla horizontal para no apilar vertical */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Verificación IA */}
        {garment.verification && (
          <SectionCard icon={<Bot className="w-4 h-4" />} title="Verificación con IA" subtitle="Análisis de autenticidad y estado">
            <div className="grid grid-cols-3 gap-2.5">
              {garment.verification.authenticityPct !== null && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
                  <p className="text-xl font-bold text-indigo-600">{garment.verification.authenticityPct.toFixed(0)}%</p>
                  <p className="text-xs text-slate-400 mt-0.5">Autenticidad</p>
                </div>
              )}
              {garment.verification.aiScore !== null && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
                  <p className="text-xl font-bold text-slate-900">{garment.verification.aiScore.toFixed(1)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Score IA</p>
                </div>
              )}
              {wearLevel && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center flex flex-col justify-center">
                  <p className="text-sm font-bold text-slate-900">{wearLevel}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Estado</p>
                </div>
              )}
            </div>
            {garment.verification.dictamen && (
              <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 mt-3">
                {garment.verification.dictamen}
              </p>
            )}
          </SectionCard>
        )}

        {/* Pasaporte digital */}
        <SectionCard icon={<Layers className="w-4 h-4" />} title="Pasaporte digital" subtitle="Identidad única e inmutable del artículo">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">Identificador único</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="font-mono text-xs text-slate-700 break-all select-all">{garment.id}</span>
              </div>
            </div>
            {garment.nftTokenId && (
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Token NFT</p>
                  <span className="font-mono text-sm font-bold text-indigo-600">#{garment.nftTokenId}</span>
                </div>
                {NFT_CONTRACT && (
                  <a
                    href={`https://sepolia.etherscan.io/token/${NFT_CONTRACT}?a=${garment.nftTokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver en blockchain
                  </a>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Historial on-chain del NFT — ancho completo */}
        {garment.nftTokenId && (
          <div className="md:col-span-2">
            <NftHistory garmentId={garment.id} tokenId={garment.nftTokenId} />
          </div>
        )}
      </div>
    </div>
  );
}

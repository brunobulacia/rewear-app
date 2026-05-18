import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Star, Package, ChevronRight, Shirt } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface SellerGarment {
  id: string;
  titulo: string;
  precio: number;
  imagenes: string[];
  marca: string | null;
  talla: string | null;
}

interface SellerProfile {
  id: string;
  walletAddress: string;
  nombre: string | null;
  avatar: string | null;
  rol: string;
  createdAt: string;
  garments: SellerGarment[];
}

interface RatingsData {
  ratings: {
    id: string;
    score: number;
    comment: string | null;
    createdAt: string;
    fromUser: { id: string; nombre: string | null; walletAddress: string };
    transaction: { garment: { id: string; titulo: string; imagenes: string[] } };
  }[];
  avg: number | null;
  total: number;
}

async function fetchSeller(userId: string): Promise<SellerProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}/profile`, { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error();
    return res.json();
  } catch { return null; }
}

async function fetchRatings(userId: string): Promise<RatingsData> {
  try {
    const res = await fetch(`${API_BASE}/ratings/user/${userId}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error();
    return res.json();
  } catch { return { ratings: [], avg: null, total: 0 }; }
}

function StarDisplay({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`${cls} ${s <= score ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  );
}

export default async function SellerPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const [seller, ratingsData] = await Promise.all([fetchSeller(userId), fetchRatings(userId)]);

  if (!seller) notFound();

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const displayName = seller.nombre || shortAddr(seller.walletAddress);
  const memberSince = new Date(seller.createdAt).toLocaleDateString('es-BO', { year: 'numeric', month: 'long' });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/catalog" className="hover:text-indigo-600 transition-colors">Catálogo</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 truncate">{displayName}</span>
      </nav>

      {/* Header vendedor */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-indigo-600 px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {displayName[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{displayName}</h1>
              <p className="text-indigo-200 text-sm font-mono mt-0.5">{shortAddr(seller.walletAddress)}</p>
              <div className="flex items-center gap-3 mt-2">
                {ratingsData.avg !== null && (
                  <div className="flex items-center gap-1.5">
                    <StarDisplay score={Math.round(ratingsData.avg)} size="sm" />
                    <span className="text-white text-sm font-semibold">{ratingsData.avg.toFixed(1)}</span>
                    <span className="text-indigo-200 text-xs">({ratingsData.total} reseñas)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
          {[
            { label: 'Prendas activas', value: seller.garments.length, icon: <Package className="w-4 h-4" /> },
            { label: 'Calificación',    value: ratingsData.avg ? ratingsData.avg.toFixed(1) : '—', icon: <Star className="w-4 h-4" /> },
            { label: 'Miembro desde',  value: memberSince, icon: <ShieldCheck className="w-4 h-4" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">{icon}<span className="text-xs">{label}</span></div>
              <p className="text-lg font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prendas */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Prendas verificadas ({seller.garments.length})
          </h2>
          {seller.garments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shirt className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm">Sin prendas activas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {seller.garments.map((g) => (
                <Link key={g.id} href={`/garment/${g.id}`}
                  className="group bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md overflow-hidden transition-all">
                  <div className="h-40 bg-slate-100 overflow-hidden">
                    {g.imagenes[0]
                      ? <img src={g.imagenes[0]} alt={g.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center"><Shirt className="w-8 h-8 text-slate-300" /></div>}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{g.titulo}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-slate-900">Bs. {g.precio.toFixed(0)}</span>
                      {g.talla && <span className="text-xs text-slate-400">Talla {g.talla}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reseñas */}
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Reseñas ({ratingsData.total})
          </h2>
          {ratingsData.ratings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-sm">
              <p className="text-slate-400 text-sm">Sin reseñas todavía.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ratingsData.ratings.slice(0, 6).map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <StarDisplay score={r.score} />
                    <span className="text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {r.comment && <p className="text-xs text-slate-600 leading-relaxed mb-2">{r.comment}</p>}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                      {(r.fromUser.nombre || r.fromUser.walletAddress)[0].toUpperCase()}
                    </div>
                    <span className="truncate">
                      {r.fromUser.nombre || shortAddr(r.fromUser.walletAddress)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import { GarmentCard } from '@/components/catalog/GarmentCard';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { Garment, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface CatalogPageProps {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    talla?: string;
    precioMin?: string;
    precioMax?: string;
    page?: string;
  }>;
}

async function fetchGarments(params: Record<string, string>): Promise<PaginatedResponse<Garment>> {
  const query = new URLSearchParams(params).toString();
  try {
    const res = await fetch(`${API_BASE}/garments?${query}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch {
    // Datos mock si el backend no está disponible
    return {
      data: MOCK_GARMENTS,
      meta: { total: MOCK_GARMENTS.length, page: 1, limit: 12, totalPages: 1 },
    };
  }
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const filterParams: Record<string, string> = {};
  if (params.q) filterParams.q = params.q;
  if (params.categoria) filterParams.categoria = params.categoria;
  if (params.talla) filterParams.talla = params.talla;
  if (params.precioMin) filterParams.precioMin = params.precioMin;
  if (params.precioMax) filterParams.precioMax = params.precioMax;
  filterParams.page = params.page || '1';

  const { data: garments, meta } = await fetchGarments(filterParams);

  const hasFilters = !!(params.q || params.categoria || params.talla || params.precioMax);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
        <p className="text-gray-500 text-sm mt-1">
          {meta.total} prenda{meta.total !== 1 ? 's' : ''} verificada{meta.total !== 1 ? 's' : ''}
          {hasFilters && ' · Resultados filtrados'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filtros */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <Suspense>
            <CatalogFilters />
          </Suspense>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {garments.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium">No se encontraron prendas</p>
              <p className="text-sm mt-1">Intenta con otros filtros</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {garments.map((garment) => (
                  <GarmentCard key={garment.id} garment={garment} />
                ))}
              </div>

              {/* Paginación */}
              {meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                    <a
                      key={p}
                      href={`/catalog?${new URLSearchParams({ ...filterParams, page: String(p) })}`}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        p === meta.page
                          ? 'bg-emerald-600 text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Mock data para cuando el backend no está disponible
const MOCK_GARMENTS: Garment[] = [
  {
    id: '1',
    titulo: "Chaqueta Levi's 501 Vintage",
    precio: 250,
    marca: "Levi's",
    talla: 'M',
    categoria: 'Chaquetas',
    imagenes: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Excelente', authenticityPct: 95 },
  },
  {
    id: '2',
    titulo: 'Vestido Floral Zara',
    precio: 120,
    marca: 'Zara',
    talla: 'S',
    categoria: 'Vestidos',
    imagenes: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Muy bueno', authenticityPct: 92 },
  },
  {
    id: '3',
    titulo: 'Zapatillas Nike Air Max 90',
    precio: 380,
    marca: 'Nike',
    talla: '42',
    categoria: 'Calzado',
    imagenes: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Muy bueno', authenticityPct: 98 },
  },
  {
    id: '4',
    titulo: 'Blazer H&M Negro',
    precio: 180,
    marca: 'H&M',
    talla: 'L',
    categoria: 'Blazers',
    imagenes: ['https://images.unsplash.com/photo-1594938298603-c8148c4b3571?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Excelente', authenticityPct: 91 },
  },
  {
    id: '5',
    titulo: 'Sweater Oversized Vintage',
    precio: 95,
    marca: 'Sin marca',
    talla: 'Única',
    categoria: 'Sweaters',
    imagenes: ['https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Bueno', authenticityPct: 88 },
  },
  {
    id: '6',
    titulo: 'Bolso Coach Signature',
    precio: 650,
    marca: 'Coach',
    talla: 'Única',
    categoria: 'Accesorios',
    imagenes: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Excelente', authenticityPct: 99 },
  },
];

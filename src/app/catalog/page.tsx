import { Suspense } from 'react';
import { GarmentCard } from '@/components/catalog/GarmentCard';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { SortSelect } from '@/components/catalog/SortSelect';
import { Garment, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface CatalogPageProps {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    talla?: string;
    precioMin?: string;
    precioMax?: string;
    sort?: string;
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
  if (params.sort) filterParams.sort = params.sort;
  filterParams.page = params.page || '1';

  const { data: garments, meta } = await fetchGarments(filterParams);

  const hasFilters = !!(params.q || params.categoria || params.talla || params.precioMax);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
          <p className="text-gray-500 text-sm mt-1">
            {meta.total} producto{meta.total !== 1 ? 's' : ''} verificado{meta.total !== 1 ? 's' : ''}
            {hasFilters && ' · Resultados filtrados'}
          </p>
        </div>
        <Suspense>
          <SortSelect />
        </Suspense>
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
              <p className="text-lg font-medium">No se encontraron productos</p>
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
    titulo: 'Nike Air Jordan 1 Retro High Bred',
    precio: 380,
    marca: 'Jordan',
    talla: '42',
    categoria: 'ZAPATILLAS',
    imagenes: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Excelente', authenticityPct: 98 },
  },
  {
    id: '2',
    titulo: 'Nike Dunk Low Panda',
    precio: 250,
    marca: 'Nike',
    talla: '40',
    categoria: 'ZAPATILLAS',
    imagenes: ['https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Muy bueno', authenticityPct: 95 },
  },
  {
    id: '3',
    titulo: 'New Balance 550 White Green',
    precio: 290,
    marca: 'New Balance',
    talla: '43',
    categoria: 'ZAPATILLAS',
    imagenes: ['https://images.unsplash.com/photo-1539185441755-769473a23570?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Muy bueno', authenticityPct: 96 },
  },
  {
    id: '4',
    titulo: 'Hoodie The North Face Negro',
    precio: 180,
    marca: 'The North Face',
    talla: 'L',
    categoria: 'PRENDAS',
    imagenes: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Excelente', authenticityPct: 92 },
  },
  {
    id: '5',
    titulo: 'Gorra New Era NY Yankees',
    precio: 95,
    marca: 'New Era',
    talla: 'Única',
    categoria: 'GORRAS',
    imagenes: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Bueno', authenticityPct: 90 },
  },
  {
    id: '6',
    titulo: 'Mochila Herschel Little America',
    precio: 220,
    marca: 'Herschel',
    talla: 'Única',
    categoria: 'MOCHILAS',
    imagenes: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
    verificationStatus: 'APPROVED',
    seller: { id: '1', walletAddress: '0x123', nombre: 'ReWear Demo', avatar: null },
    verification: { wearLevel: 'Excelente', authenticityPct: 97 },
  },
];

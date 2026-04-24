'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIAS = ['Chaquetas', 'Vestidos', 'Calzado', 'Blazers', 'Sweaters', 'Pantalones', 'Camisas', 'Accesorios'];
const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43'];

export function CatalogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [categoria, setCategoria] = useState(searchParams.get('categoria') || '');
  const [talla, setTalla] = useState(searchParams.get('talla') || '');
  const [precioMax, setPrecioMax] = useState(searchParams.get('precioMax') || '');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoria) params.set('categoria', categoria);
    if (talla) params.set('talla', talla);
    if (precioMax) params.set('precioMax', precioMax);
    router.push(`/catalog?${params.toString()}`);
  };

  const clearFilters = () => {
    setQ(''); setCategoria(''); setTalla(''); setPrecioMax('');
    router.push('/catalog');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Filtros</h3>

      {/* Búsqueda */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Buscar</label>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nike, vestido floral..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
        />
      </div>

      {/* Categoría */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Categoría</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todas</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Talla */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Talla</label>
        <select
          value={talla}
          onChange={(e) => setTalla(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todas</option>
          {TALLAS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Precio máximo */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Precio máximo (Bs.)
        </label>
        <input
          type="number"
          value={precioMax}
          onChange={(e) => setPrecioMax(e.target.value)}
          placeholder="500"
          min={0}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={applyFilters}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Aplicar filtros
        </button>
        <button
          onClick={clearFilters}
          className="w-full border border-gray-200 hover:bg-gray-50 text-gray-600 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Search, X } from 'lucide-react';

const CATEGORIAS = ['Chaquetas', 'Vestidos', 'Calzado', 'Blazers', 'Sweaters', 'Pantalones', 'Camisas', 'Accesorios'];
const TALLAS     = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43'];

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400';

export function CatalogFilters() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [q,         setQ]         = useState(searchParams.get('q')         || '');
  const [categoria, setCategoria] = useState(searchParams.get('categoria') || '');
  const [talla,     setTalla]     = useState(searchParams.get('talla')     || '');
  const [precioMax, setPrecioMax] = useState(searchParams.get('precioMax') || '');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (q)         params.set('q',         q);
    if (categoria) params.set('categoria', categoria);
    if (talla)     params.set('talla',     talla);
    if (precioMax) params.set('precioMax', precioMax);
    const sort = searchParams.get('sort');
    if (sort)      params.set('sort',      sort); // conservar el orden elegido
    router.push(`/catalog?${params.toString()}`);
  };

  const clearFilters = () => {
    setQ(''); setCategoria(''); setTalla(''); setPrecioMax('');
    router.push('/catalog');
  };

  const hasFilters = !!(q || categoria || talla || precioMax);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-sm">Filtros</span>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1.5">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Nike, vestido floral..."
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1.5">Categoría</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputCls}>
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1.5">Talla</label>
          <select value={talla} onChange={(e) => setTalla(e.target.value)} className={inputCls}>
            <option value="">Todas</option>
            {TALLAS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1.5">Precio máximo (Bs.)</label>
          <input
            type="number"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            placeholder="500"
            min={0}
            className={inputCls}
          />
        </div>
      </div>

      <button
        onClick={applyFilters}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Aplicar filtros
      </button>
    </div>
  );
}

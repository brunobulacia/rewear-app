'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { api } from '@/lib/api';
import { getStoredToken, getStoredUser } from '@/lib/auth';
import { GarmentDetail } from '@/types';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';

const CATEGORIAS = ['Chaquetas','Vestidos','Calzado','Blazers','Sweaters','Accesorios','Pantalones','Camisas','Faldas','Abrigos','Otros'];
const TALLAS     = ['XS','S','M','L','XL','XXL','36','37','38','39','40','41','42','43','Única'];

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white placeholder:text-slate-400 disabled:bg-slate-50';

interface EditForm {
  titulo: string;
  descripcion: string;
  marca: string;
  estilo: string;
  categoria: string;
  talla: string;
  precio: string;
}

export default function EditGarmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [garment, setGarment] = useState<GarmentDetail | null>(null);
  const [form, setForm]       = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');
  const [notOwner, setNotOwner] = useState(false);

  useEffect(() => {
    api.get<GarmentDetail>(`/garments/${id}`)
      .then((g) => {
        setGarment(g);
        const me = getStoredUser();
        if (me && g.seller?.id && me.id !== g.seller.id) setNotOwner(true);
        setForm({
          titulo: g.titulo ?? '',
          descripcion: g.descripcion ?? '',
          marca: g.marca ?? '',
          estilo: g.estilo ?? '',
          categoria: g.categoria ?? '',
          talla: g.talla ?? '',
          precio: String(g.precio ?? ''),
        });
      })
      .catch(() => setError('No se pudo cargar la prenda.'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: keyof EditForm, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const handleSave = async () => {
    if (!form) return;
    if (!getStoredToken()) { setError('Iniciá sesión con tu billetera para editar.'); return; }
    if (!form.titulo.trim()) { setError('El título es obligatorio.'); return; }
    const precio = Number(form.precio);
    if (!Number.isFinite(precio) || precio < 1) { setError('Precio inválido (mínimo 1).'); return; }

    setSaving(true);
    setError('');
    try {
      await api.patch<GarmentDetail>(`/garments/${id}`, {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        marca: form.marca.trim() || undefined,
        estilo: form.estilo.trim() || undefined,
        categoria: form.categoria || undefined,
        talla: form.talla || undefined,
        precio,
      });
      setSaved(true);
      setTimeout(() => router.push('/profile'), 1200);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      setError(msg.includes('403') ? 'No podés editar una prenda que no es tuya.' : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-10 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Conectá tu billetera</h2>
          <p className="text-slate-500 text-sm">Necesitás iniciar sesión para editar una prenda.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-10 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No es tu prenda</h2>
          <p className="text-slate-500 text-sm mb-4">Solo el vendedor que la publicó puede editarla.</p>
          <Link href="/profile" className="text-indigo-600 hover:underline text-sm font-medium">Volver a mi perfil</Link>
        </div>
      </div>
    );
  }

  if (!form || !garment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        {error || 'Prenda no encontrada.'}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver a mi perfil
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Editar prenda</h1>
      <p className="text-slate-500 text-sm mb-6">
        Actualizá los datos de tu prenda. El pasaporte NFT y la verificación no se modifican.
      </p>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4" /> Cambios guardados. Redirigiendo…
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        {/* Imagen + estado (no editable) */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
            {garment.imagenes?.[0]
              ? <img src={garment.imagenes[0]} alt={garment.titulo} className="w-full h-full object-cover" />
              : null}
          </div>
          <div>
            <p className="text-xs text-slate-400">Las fotos y la verificación no se editan acá.</p>
            <span className="inline-block mt-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
              {garment.estado === 'VERIFIED' ? '✓ Verificado' : garment.estado}
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1.5">Título *</label>
          <input type="text" value={form.titulo} onChange={(e) => set('titulo', e.target.value)}
            placeholder="Ej: Chaqueta Levi's 501 Vintage" className={inputCls} />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1.5">Descripción</label>
          <textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Describí el estado, uso y detalles..." rows={3} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Marca</label>
            <input type="text" value={form.marca} onChange={(e) => set('marca', e.target.value)}
              placeholder="Nike, Zara..." className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Estilo</label>
            <input type="text" value={form.estilo} onChange={(e) => set('estilo', e.target.value)}
              placeholder="Casual, formal..." className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Categoría</label>
            <select value={form.categoria} onChange={(e) => set('categoria', e.target.value)} className={inputCls}>
              <option value="">Seleccionar...</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Talla</label>
            <select value={form.talla} onChange={(e) => set('talla', e.target.value)} className={inputCls}>
              <option value="">Seleccionar...</option>
              {TALLAS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1.5">Precio (Bs.) *</label>
          <input type="number" min="1" value={form.precio} onChange={(e) => set('precio', e.target.value)}
            placeholder="150" className={`${inputCls} max-w-40`} />
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href="/profile"
            className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  );
}

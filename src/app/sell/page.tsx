'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { getStoredToken, getStoredUser } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const CATEGORIAS = [
  'Chaquetas', 'Vestidos', 'Calzado', 'Blazers', 'Sweaters',
  'Accesorios', 'Pantalones', 'Camisas', 'Faldas', 'Abrigos', 'Otros',
];
const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', 'Única'];

type Step = 'form' | 'uploading' | 'verifying' | 'approved' | 'error';

interface VerificationPoll {
  verificationStatus: string;
  nftTokenId: string | null;
}

export default function SellPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const user = typeof window !== 'undefined' ? getStoredUser() : null;
  const token = typeof window !== 'undefined' ? getStoredToken() : null;

  const [step, setStep] = useState<Step>('form');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    marca: '',
    talla: '',
    categoria: '',
    estilo: '',
    precio: '',
  });

  // Polling cuando está verificando
  useEffect(() => {
    if (step !== 'verifying' || !createdId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/garments/${createdId}`);
        if (!res.ok) return;
        const data: VerificationPoll = await res.json();

        if (data.verificationStatus === 'APPROVED' || data.verificationStatus === 'REJECTED') {
          clearInterval(interval);
          if (data.verificationStatus === 'APPROVED') {
            setStep('approved');
            setTimeout(() => router.push(`/garment/${createdId}`), 2500);
          } else {
            setError('La prenda no pasó la verificación de IA.');
            setStep('error');
          }
        }
      } catch {
        // retry
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, createdId, router]);

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const valid = Array.from(selected).filter((f) => f.type.startsWith('image/')).slice(0, 5);
    setFiles(valid);
    setPreviews(valid.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError('Debés iniciar sesión primero.'); return; }
    if (files.length === 0) { setError('Subí al menos una foto.'); return; }
    if (!form.titulo || !form.precio) { setError('Título y precio son obligatorios.'); return; }

    setError('');
    setStep('uploading');

    try {
      const body = new FormData();
      files.forEach((f) => body.append('images', f));
      Object.entries(form).forEach(([k, v]) => { if (v) body.append(k, v); });

      const res = await fetch(`${API_BASE}/garments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al publicar la prenda');
      }

      const garment = await res.json();
      setCreatedId(garment.id);
      setStep('verifying');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStep('error');
    }
  };

  if (!isConnected || !user || !token) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🔐
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Conecta tu billetera</h2>
          <p className="text-gray-500 text-sm">
            Para vender en ReWear necesitás conectar tu billetera e iniciar sesión.
          </p>
        </div>
      </div>
    );
  }

  // Estados de progreso
  if (step === 'uploading' || step === 'verifying' || step === 'approved') {
    const stages = [
      { key: 'uploading', label: 'Subiendo imágenes', icon: '📤' },
      { key: 'verifying', label: 'Verificando con IA', icon: '🤖' },
      { key: 'approved', label: 'Generando pasaporte NFT', icon: '⛓️' },
    ];
    const currentIdx = stages.findIndex((s) => s.key === step);

    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-6 animate-pulse">{stages[currentIdx].icon}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{stages[currentIdx].label}...</h2>
          {step === 'verifying' && (
            <p className="text-gray-500 text-sm mb-6">
              Nuestra IA está analizando las imágenes para verificar autenticidad y estado.
            </p>
          )}
          {step === 'approved' && (
            <p className="text-gray-500 text-sm mb-6">
              ¡Prenda aprobada! Emitiendo pasaporte digital en Polygon. Redirigiendo...
            </p>
          )}

          {/* Barra de progreso */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {stages.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < currentIdx
                      ? 'bg-emerald-600 text-white'
                      : i === currentIdx
                        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i < currentIdx ? '✓' : i + 1}
                </div>
                {i < stages.length - 1 && (
                  <div className={`h-0.5 w-8 ${i < currentIdx ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-red-200 p-8">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Algo salió mal</h2>
          <p className="text-red-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => { setStep('form'); setError(''); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Publicar prenda</h1>
        <p className="text-gray-500 text-sm mt-1">
          Subí fotos y completá los datos. La IA verificará tu prenda y se emitirá un pasaporte NFT en Polygon.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload de imágenes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Fotos de la prenda</h2>
          <p className="text-xs text-gray-500 mb-4">
            Hasta 5 fotos. Incluí etiquetas y detalles. La IA analiza todas las imágenes.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {previews.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 hover:border-emerald-400 rounded-xl py-12 flex flex-col items-center gap-2 text-gray-400 hover:text-emerald-600 transition-colors"
            >
              <span className="text-3xl">📷</span>
              <span className="text-sm font-medium">Hacer clic para subir fotos</span>
              <span className="text-xs">JPG, PNG, WEBP — máx. 5MB cada una</span>
            </button>
          ) : (
            <div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={src} alt={`preview ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-emerald-600 hover:underline"
              >
                Cambiar fotos
              </button>
            </div>
          )}
        </div>

        {/* Datos de la prenda */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Datos de la prenda</h2>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: Chaqueta Levi's 501 Vintage"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Describí el estado, uso y detalles de la prenda..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Marca</label>
              <input
                type="text"
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                placeholder="Nike, Zara..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Estilo</label>
              <input
                type="text"
                value={form.estilo}
                onChange={(e) => setForm({ ...form, estilo: e.target.value })}
                placeholder="Casual, formal..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Categoría</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Seleccionar...</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Talla</label>
              <select
                value={form.talla}
                onChange={(e) => setForm({ ...form, talla: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Seleccionar...</option>
                {TALLAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Precio (Bs.) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
              placeholder="150"
              min="1"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Info del proceso */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-emerald-900 mb-2">¿Qué pasa después de publicar?</h3>
          <ol className="text-xs text-emerald-800 space-y-1">
            <li>1. 🤖 <strong>IA analiza</strong> tus fotos y verifica autenticidad y estado</li>
            <li>2. ✅ Si es aprobada, se genera un <strong>pasaporte digital NFT</strong> en Polygon</li>
            <li>3. 🛍️ La prenda aparece en el <strong>catálogo</strong> para compradores</li>
          </ol>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          Publicar y verificar prenda
        </button>
      </form>
    </div>
  );
}

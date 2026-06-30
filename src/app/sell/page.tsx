'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { getStoredToken, getStoredUser } from '@/lib/auth';
import { Upload, Bot, Layers, Check, X, Camera, Wallet, ShieldCheck, Sparkles } from 'lucide-react';
import { CATEGORIA_OPTIONS as CATEGORIAS } from '@/lib/categoria';

const API_BASE   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const CONDICIONES = ['Nuevo con etiqueta','Nuevo sin etiqueta','Como nuevo','Usado - excelente','Usado - bueno','Usado - aceptable'];
const TALLAS     = ['XS','S','M','L','XL','XXL','36','37','38','39','40','41','42','43','44','45','Única'];

type Step = 'form' | 'uploading' | 'verifying' | 'approved' | 'error';

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white placeholder:text-slate-400';

export default function SellPage() {
  const router              = useRouter();
  const { isConnected }     = useAccount();
  const user                = typeof window !== 'undefined' ? getStoredUser() : null;
  const token               = typeof window !== 'undefined' ? getStoredToken() : null;

  const [step, setStep]         = useState<Step>('form');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError]       = useState('');
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles]       = useState<File[]>([]);
  const [autofilling, setAutofilling] = useState(false);
  const fileInputRef            = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    titulo: '', descripcion: '', marca: '', modelo: '', colorway: '', talla: '',
    categoria: '', estilo: '', condicion: '', precio: '',
  });

  // Evita el desajuste de hidratación: el estado de la wallet/sesión solo existe
  // en el cliente. Renderizamos un placeholder estable hasta montar.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (step !== 'verifying' || !createdId) return;
    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`${API_BASE}/garments/${createdId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.verificationStatus === 'APPROVED' || data.verificationStatus === 'REJECTED') {
          clearInterval(interval);
          if (data.verificationStatus === 'APPROVED') {
            setStep('approved');
            setTimeout(() => router.push(`/garment/${createdId}`), 2500);
          } else {
            const motivo = (data.verification?.dictamen || '')
              .replace(/^RECHAZAD[OA]:\s*/i, '')
              .trim();
            setError(motivo || 'La imagen no parece ser un producto de marca válido.');
            setStep('error');
          }
        }
      } catch { /* retry */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [step, createdId, router]);

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const valid = Array.from(selected).filter((f) => f.type.startsWith('image/')).slice(0, 5);
    setFiles(valid);
    setPreviews(valid.map((f) => URL.createObjectURL(f)));
  };

  // Convierte un File a base64 (sin el prefijo data:...;base64,) para la IA.
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Pide a la IA que extraiga los datos del producto desde las fotos y prellena el form.
  const handleAutofill = async () => {
    if (!files.length || autofilling) return;
    setError('');
    setAutofilling(true);
    try {
      const images = await Promise.all(
        files.slice(0, 4).map(async (f) => ({ media_type: f.type, data: await fileToBase64(f) })),
      );
      const res  = await fetch('/api/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo completar con IA.');
      const f = data.fields || {};
      setForm((prev) => ({
        ...prev,
        titulo:      f.titulo || prev.titulo,
        descripcion: f.descripcion || prev.descripcion,
        marca:       f.marca || prev.marca,
        modelo:      f.modelo || prev.modelo,
        colorway:    f.colorway || prev.colorway,
        estilo:      f.estilo || prev.estilo,
        talla:       TALLAS.includes(f.talla) ? f.talla : prev.talla,
        categoria:   CATEGORIAS.some((c) => c.value === f.categoria) ? f.categoria : prev.categoria,
        condicion:   CONDICIONES.includes(f.condicion) ? f.condicion : prev.condicion,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al completar con IA.');
    } finally {
      setAutofilling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token)          { setError('Debés iniciar sesión primero.'); return; }
    if (!files.length)   { setError('Subí al menos una foto.'); return; }
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
        throw new Error(err.message || 'Error al publicar');
      }
      const garment = await res.json();
      setCreatedId(garment.id);
      setStep('verifying');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStep('error');
    }
  };

  // Placeholder estable durante SSR / antes de montar (evita hydration mismatch).
  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isConnected || !user || !token) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Conecta tu billetera</h2>
          <p className="text-slate-500 text-sm">Para vender en ReWear necesitás conectar tu billetera e iniciar sesión.</p>
        </div>
      </div>
    );
  }

  // Los administradores no publican productos — solo gestionan disputas.
  if (user.rol === 'ADMIN') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Cuenta de administrador</h2>
          <p className="text-slate-500 text-sm mb-4">Los administradores no publican productos. Tu rol es gestionar disputas.</p>
          <a href="/admin" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
            Ir al Panel de Disputas
          </a>
        </div>
      </div>
    );
  }

  const stages = [
    { key: 'uploading', label: 'Subiendo imágenes',     icon: <Upload className="w-5 h-5" /> },
    { key: 'verifying', label: 'Verificando con IA',    icon: <Bot className="w-5 h-5" /> },
    { key: 'approved',  label: 'Generando pasaporte NFT', icon: <Layers className="w-5 h-5" /> },
  ];

  if (step === 'uploading' || step === 'verifying' || step === 'approved') {
    const currentIdx = stages.findIndex((s) => s.key === step);
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            {stages[currentIdx].icon}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{stages[currentIdx].label}...</h2>
          {step === 'verifying' && (
            <p className="text-slate-500 text-sm mb-6">Nuestra IA está analizando las imágenes para verificar autenticidad y estado.</p>
          )}
          {step === 'approved' && (
            <p className="text-slate-500 text-sm mb-6">Producto aprobado. Emitiendo pasaporte digital en Ethereum. Redirigiendo...</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-6">
            {stages.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < currentIdx  ? 'bg-indigo-600 text-white' :
                  i === currentIdx ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {i < currentIdx ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < stages.length - 1 && (
                  <div className={`h-0.5 w-8 ${i < currentIdx ? 'bg-indigo-600' : 'bg-slate-200'}`} />
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
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Bot className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">La IA rechazó la imagen</h2>
          <p className="text-slate-500 text-sm mb-4">
            Solo se pueden publicar productos de marca: zapatillas, prendas, gorras o mochilas/bolsos.
          </p>
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-6 text-left">
            <p className="text-xs font-medium text-red-400 mb-1">Veredicto de la IA</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={() => { setStep('form'); setError(''); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Probar con otra imagen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Publicar producto</h1>
        <p className="text-slate-500 text-sm mt-1">
          Subí fotos y completá los datos. La IA verificará tu producto y se emitirá un pasaporte NFT en Ethereum.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Columna izquierda: fotos + qué pasa después */}
        <div className="space-y-5 lg:sticky lg:top-8">
        {/* Upload */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Fotos del producto</h2>
          <p className="text-xs text-slate-400 mb-4">Hasta 5 fotos. Incluí etiquetas y detalles.</p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          {previews.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl py-12 flex flex-col items-center gap-3 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm font-medium">Hacer clic para subir fotos</span>
              <span className="text-xs">JPG, PNG, WEBP</span>
            </button>
          ) : (
            <div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={src} alt={`preview ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-indigo-600 hover:underline">
                Cambiar fotos
              </button>

              {/* Rellenar con IA */}
              <button
                type="button"
                onClick={handleAutofill}
                disabled={autofilling}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed border border-indigo-200 text-indigo-700 py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                {autofilling ? (
                  <>
                    <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Analizando fotos...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Rellenar datos con IA
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                La IA completa título, marca, modelo y más a partir de tus fotos. Revisalos antes de publicar.
              </p>
            </div>
          )}
        </div>

        {/* Info: qué pasa después */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-indigo-900 mb-2">¿Qué pasa después de publicar?</h3>
          <ol className="text-xs text-indigo-700 space-y-1.5">
            <li className="flex items-start gap-2"><Bot className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span><strong>IA analiza</strong> tus fotos y verifica autenticidad y estado</span></li>
            <li className="flex items-start gap-2"><ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span>Si es aprobada, se genera un <strong>pasaporte digital NFT</strong> en Ethereum</span></li>
            <li className="flex items-start gap-2"><Layers className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span>El producto aparece en el <strong>catálogo</strong> para compradores</span></li>
          </ol>
        </div>
        </div>{/* fin columna izquierda */}

        {/* Columna derecha: datos + envío */}
        <div className="space-y-5">
        {/* Datos */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Datos del producto</h2>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Título <span className="text-red-500">*</span></label>
            <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: Nike Air Jordan 1 Retro High Bred" className={inputCls} required />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Describí el estado, uso y detalles..." rows={3}
              className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Marca</label>
              <input type="text" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })}
                placeholder="Nike, Jordan, Adidas..." className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Modelo</label>
              <input type="text" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                placeholder="Air Jordan 1, Dunk Low..." className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Colorway</label>
              <input type="text" value={form.colorway} onChange={(e) => setForm({ ...form, colorway: e.target.value })}
                placeholder="Bred, Panda..." className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Estilo</label>
              <input type="text" value={form.estilo} onChange={(e) => setForm({ ...form, estilo: e.target.value })}
                placeholder="Casual, retro..." className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Categoría</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls}>
                <option value="">Seleccionar...</option>
                {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Talla</label>
              <select value={form.talla} onChange={(e) => setForm({ ...form, talla: e.target.value })} className={inputCls}>
                <option value="">Seleccionar...</option>
                {TALLAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Condición</label>
            <select value={form.condicion} onChange={(e) => setForm({ ...form, condicion: e.target.value })} className={inputCls}>
              <option value="">Seleccionar...</option>
              {CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Precio (Bs.) <span className="text-red-500">*</span></label>
            <input type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })}
              placeholder="150" min="1" className={inputCls} required />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <X className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
          Publicar y verificar producto
        </button>
        </div>{/* fin columna derecha */}
        </div>{/* fin grid */}
      </form>
    </div>
  );
}


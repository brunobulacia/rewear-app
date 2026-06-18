'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Sparkles, MapPin } from 'lucide-react';

interface Props {
  user: User;
  onComplete: (updated: User) => void;
}

/**
 * Se muestra la primera vez que un usuario inicia sesión (cuando todavía no
 * tiene nombre). Pide datos básicos de perfil en vez de mostrar solo la wallet.
 */
export function OnboardingModal({ user, onComplete }: Props) {
  const [nombre, setNombre]       = useState(user.nombre || '');
  const [ubicacion, setUbicacion] = useState(user.ubicacion || 'Santa Cruz de la Sierra');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const submit = async () => {
    if (!nombre.trim()) { setError('Ingresá tu nombre.'); return; }
    setSaving(true);
    setError('');
    try {
      const updated = await api.patch<User>('/users/me', {
        nombre: nombre.trim(),
        ubicacion: ubicacion.trim() || undefined,
      });
      localStorage.setItem('rewear_user', JSON.stringify(updated));
      onComplete(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">¡Bienvenido/a a ReWear!</h2>
        <p className="text-sm text-slate-500 mt-1 mb-5">
          Completá tu perfil para que la comunidad te conozca. Podés editarlo después desde tu perfil.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Nombre o apodo *</label>
            <input
              type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: María Pérez"
              maxLength={100}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Ciudad</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Santa Cruz de la Sierra"
                maxLength={200}
                className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <button
          onClick={submit} disabled={saving}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          {saving ? 'Guardando...' : 'Empezar a usar ReWear'}
        </button>
      </div>
    </div>
  );
}

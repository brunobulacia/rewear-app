'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from '@/types';
import Link from 'next/link';

interface MyGarment {
  id: string;
  titulo: string;
  precio: number;
  marca: string | null;
  talla: string | null;
  imagenes: string[];
  estado: string;
  verificationStatus: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  verification: { wearLevel: string | null; authenticityPct: number | null } | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:     { label: 'Pendiente',    className: 'bg-yellow-100 text-yellow-700' },
  IN_PROGRESS: { label: 'Verificando', className: 'bg-blue-100 text-blue-700 animate-pulse' },
  APPROVED:    { label: 'Verificado',  className: 'bg-emerald-100 text-emerald-700' },
  REJECTED:    { label: 'Rechazado',   className: 'bg-red-100 text-red-700' },
};

export default function ProfilePage() {
  const { isConnected } = useAccount();
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', ubicacion: '', avatar: '' });
  const [saved, setSaved] = useState(false);
  const [garments, setGarments] = useState<MyGarment[]>([]);
  const [loadingGarments, setLoadingGarments] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setForm({ nombre: stored.nombre || '', email: stored.email || '', ubicacion: stored.ubicacion || '', avatar: stored.avatar || '' });
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    setLoadingGarments(true);
    api.get<MyGarment[]>('/garments/mine')
      .then(setGarments)
      .catch(() => {})
      .finally(() => setLoadingGarments(false));
  }, []);

  const handleSave = async () => {
    if (!getStoredToken()) return;
    setSaving(true);
    try {
      const updated = await api.patch<User>('/users/me', form);
      setUser(updated);
      localStorage.setItem('rewear_user', JSON.stringify(updated));
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isConnected || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Conecta tu billetera</h2>
          <p className="text-gray-500 text-sm">Necesitas conectar tu billetera e iniciar sesión para ver tu perfil.</p>
        </div>
      </div>
    );
  }

  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tu información personal y tus prendas</p>
      </div>

      {/* Card principal */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-emerald-600 text-2xl font-bold shadow">
              {user.nombre?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-white text-lg font-semibold">{user.nombre || 'Sin nombre'}</h2>
              <p className="text-emerald-100 text-sm font-mono">{shortAddress(user.walletAddress)}</p>
              <span className="inline-block mt-1 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">{user.rol}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm">
              ✓ Perfil actualizado correctamente
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nombre</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} disabled={!editing} placeholder="Tu nombre" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!editing} placeholder="tu@email.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Ubicación</label>
            <input type="text" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} disabled={!editing} placeholder="Ciudad, País" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Dirección de billetera</label>
            <input type="text" value={user.walletAddress} disabled className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 font-mono" />
          </div>
          <div className="flex gap-2 pt-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Editar perfil</button>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
                <button onClick={() => setEditing(false)} className="border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info de cuenta */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Información de cuenta</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Miembro desde</dt>
            <dd className="text-gray-900 font-medium">{new Date(user.createdAt).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Red</dt>
            <dd className="text-gray-900 font-medium">Polygon Amoy</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Prendas publicadas</dt>
            <dd className="text-gray-900 font-medium">{garments.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Prendas verificadas</dt>
            <dd className="text-emerald-600 font-medium">{garments.filter(g => g.verificationStatus === 'APPROVED').length}</dd>
          </div>
        </dl>
      </div>

      {/* Armario digital */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Mi Armario Digital</h3>
            <p className="text-xs text-gray-500 mt-0.5">Tus prendas y sus pasaportes NFT</p>
          </div>
          <Link href="/sell" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
            + Publicar prenda
          </Link>
        </div>

        <div className="p-6">
          {loadingGarments ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : garments.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">👗</div>
              <p className="text-gray-500 text-sm">Todavía no publicaste ninguna prenda.</p>
              <Link href="/sell" className="mt-3 inline-block text-sm text-emerald-600 hover:underline font-medium">Publicar mi primera prenda →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {garments.map((g) => {
                const status = STATUS_CONFIG[g.verificationStatus] || STATUS_CONFIG.PENDING;
                const img = g.imagenes[0];
                return (
                  <Link key={g.id} href={g.verificationStatus === 'APPROVED' ? `/garment/${g.id}` : '#'} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${g.verificationStatus === 'APPROVED' ? 'border-gray-200 hover:border-emerald-300 hover:shadow-sm' : 'border-gray-100 bg-gray-50 cursor-default'}`}>
                    {/* Imagen */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                      {img ? (
                        <img src={img} alt={g.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">👕</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{g.titulo}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">Bs. {g.precio}</span>
                        {g.marca && <span className="text-xs text-gray-400">· {g.marca}</span>}
                      </div>
                      {g.verificationStatus === 'APPROVED' && g.verification && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {g.verification.authenticityPct?.toFixed(0)}% auténtico · {g.verification.wearLevel}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${status.className}`}>
                      {status.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useBalance } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from '@/types';
import Link from 'next/link';
import { TransactionsList } from '@/components/profile/TransactionsList';
import { Wallet, ShieldCheck, Plus, Shirt, Pencil, Check, X } from 'lucide-react';

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

const GARMENT_STATUS: Record<string, { label: string; className: string }> = {
  PENDING:     { label: 'Pendiente',   className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  IN_PROGRESS: { label: 'Verificando', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  APPROVED:    { label: 'Verificado',  className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  REJECTED:    { label: 'Rechazado',   className: 'bg-red-50 text-red-700 border border-red-200' },
};

export default function ProfilePage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: sepolia.id,
  });
  const [user, setUser]           = useState<User | null>(null);
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [form, setForm]           = useState({ nombre: '', email: '', ubicacion: '', avatar: '' });
  const [garments, setGarments]   = useState<MyGarment[]>([]);
  const [loadingGarments, setLoadingGarments] = useState(false);
  const [editPriceId, setEditPriceId]   = useState<string | null>(null);
  const [priceInput, setPriceInput]     = useState('');
  const [savingPrice, setSavingPrice]   = useState(false);
  const [priceError, setPriceError]     = useState('');

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

  const startEditPrice = (e: React.MouseEvent, g: MyGarment) => {
    e.preventDefault();
    e.stopPropagation();
    setEditPriceId(g.id);
    setPriceInput(String(g.precio));
    setPriceError('');
  };

  const cancelEditPrice = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditPriceId(null);
    setPriceError('');
  };

  const savePrice = async (e: React.MouseEvent, g: MyGarment) => {
    e.preventDefault();
    e.stopPropagation();
    const nuevo = Number(priceInput);
    if (!Number.isFinite(nuevo) || nuevo < 1) {
      setPriceError('Precio inválido');
      return;
    }
    setSavingPrice(true);
    setPriceError('');
    try {
      const updated = await api.patch<MyGarment>(`/garments/${g.id}`, { precio: nuevo });
      setGarments((prev) => prev.map((x) => (x.id === g.id ? { ...x, precio: updated.precio } : x)));
      setEditPriceId(null);
    } catch {
      setPriceError('No se pudo guardar');
    } finally {
      setSavingPrice(false);
    }
  };

  if (!isConnected || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-10 shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Conecta tu billetera</h2>
          <p className="text-slate-500 text-sm">Necesitás conectar tu billetera e iniciar sesión para ver tu perfil.</p>
        </div>
      </div>
    );
  }

  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-slate-500 text-sm mt-1">Gestiona tu información personal y tus prendas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Columna izquierda: perfil + información de cuenta */}
        <div className={user.rol === 'ADMIN'
          ? 'lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-5 items-start'
          : 'lg:col-span-1 space-y-5 lg:sticky lg:top-8'}>

      {/* Card principal */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-indigo-600 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
              {user.nombre?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-white text-lg font-semibold">{user.nombre || 'Sin nombre'}</h2>
              <p className="text-indigo-200 text-sm font-mono">{shortAddress(user.walletAddress)}</p>
              <span className="inline-block mt-1.5 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {user.rol}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Perfil actualizado correctamente
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Nombre</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              disabled={!editing} placeholder="Tu nombre" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={!editing} placeholder="tu@email.com" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Ubicación</label>
            <input type="text" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              disabled={!editing} placeholder="Ciudad, País" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Dirección de billetera</label>
            <input type="text" value={user.walletAddress} disabled className={`${inputCls} font-mono text-xs`} />
          </div>
          <div className="flex gap-2 pt-2">
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Editar perfil
              </button>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info cuenta */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 text-sm">Información de cuenta</h3>
        <dl className="space-y-2 text-sm">
          {[
            { dt: 'Miembro desde', dd: user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
            { dt: 'Red',           dd: 'Ethereum Sepolia' },
            { dt: 'Balance ETH',   dd: balanceLoading ? '...' : balance ? `${(Number(balance.value) / 1e18).toFixed(4)} ${balance.symbol}` : '—', highlight: true },
            ...(user.rol === 'ADMIN' ? [] : [
              { dt: 'Prendas publicadas', dd: String(garments.length) },
              { dt: 'Prendas verificadas', dd: String(garments.filter(g => g.verificationStatus === 'APPROVED').length), highlight: true },
            ]),
          ].map(({ dt, dd, highlight }) => (
            <div key={dt} className="flex justify-between">
              <dt className="text-slate-500">{dt}</dt>
              <dd className={`font-medium ${highlight ? 'text-indigo-600' : 'text-slate-900'}`}>{dd}</dd>
            </div>
          ))}
        </dl>
      </div>

        </div>{/* fin columna izquierda */}

      {/* Columna derecha (comprador/vendedor): transacciones y armario. El admin no las ve. */}
      {user.rol !== 'ADMIN' && (
      <div className="lg:col-span-2 space-y-5">
      {/* Transacciones */}
      <TransactionsList currentUserId={user.id} />

      {/* Armario digital */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Mi Armario Digital</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tus prendas y sus pasaportes NFT</p>
          </div>
          <Link href="/sell"
            className="inline-flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> Publicar prenda
          </Link>
        </div>

        <div className="p-6">
          {loadingGarments ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : garments.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shirt className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm">Todavía no publicaste ninguna prenda.</p>
              <Link href="/sell" className="mt-2 inline-block text-sm text-indigo-600 hover:underline font-medium">
                Publicar mi primera prenda
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {garments.map((g) => {
                const status = GARMENT_STATUS[g.verificationStatus] || GARMENT_STATUS.PENDING;
                const img    = g.imagenes[0];
                const approved = g.verificationStatus === 'APPROVED';
                return (
                  <div key={g.id}
                    onClick={() => approved && router.push(`/garment/${g.id}`)}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      approved
                        ? 'border-slate-200 hover:border-indigo-300 hover:shadow-sm cursor-pointer'
                        : 'border-slate-100 bg-slate-50 cursor-default'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {img
                        ? <img src={img} alt={g.titulo} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Shirt className="w-5 h-5 text-slate-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{g.titulo}</p>
                      {editPriceId === g.id ? (
                        <div className="flex items-center gap-1.5 mt-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <span className="text-xs text-slate-500">Bs.</span>
                          <input
                            type="number" min="1" value={priceInput} autoFocus
                            onChange={(e) => setPriceInput(e.target.value)}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className="w-24 border border-indigo-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            aria-label="Nuevo precio en bolivianos"
                          />
                          <button onClick={(e) => savePrice(e, g)} disabled={savingPrice}
                            className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white" aria-label="Guardar precio">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={cancelEditPrice} disabled={savingPrice}
                            className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-500" aria-label="Cancelar">
                            <X className="w-3.5 h-3.5" />
                          </button>
                          {priceError && <span className="text-xs text-red-600 ml-1">{priceError}</span>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">Bs. {g.precio}</span>
                          {g.marca && <span className="text-xs text-slate-400">· {g.marca}</span>}
                          <button onClick={(e) => startEditPrice(e, g)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
                            aria-label="Editar precio">
                            <Pencil className="w-3 h-3" /> Editar precio
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); router.push(`/garment/${g.id}/edit`); }}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 hover:underline"
                            aria-label="Editar prenda completa">
                            <Pencil className="w-3 h-3" /> Editar todo
                          </button>
                        </div>
                      )}
                      {g.verificationStatus === 'APPROVED' && g.verification && (
                        <p className="text-xs text-indigo-600 mt-0.5">
                          {g.verification.authenticityPct?.toFixed(0)}% auténtico · {g.verification.wearLevel}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
      )}
      </div>{/* fin grid */}
    </div>
  );
}

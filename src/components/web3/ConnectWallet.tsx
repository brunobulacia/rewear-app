'use client';

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState, useEffect } from 'react';
import { signIn, clearAuth, getStoredUser, getStoredToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Wallet, ChevronDown, LogOut, User as UserIcon, Tag, LayoutGrid, ShieldCheck } from 'lucide-react';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { mutate: connect, error: connectError, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [user, setUser]           = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showMenu, setShowMenu]   = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    // Mostrar la sesión guardada de inmediato (evita el "flash" de deslogueo al recargar).
    const stored = getStoredUser();
    if (stored) setUser(stored);
    // Revalidar en segundo plano. SOLO desloguear si el token es inválido (401/403);
    // ante errores de red o del servidor, mantener la sesión.
    api.get<User>('/users/me')
      .then((u) => {
        setUser(u);
        localStorage.setItem('rewear_user', JSON.stringify(u));
      })
      .catch((err: { status?: number }) => {
        if (err?.status === 401 || err?.status === 403) {
          clearAuth();
          setUser(null);
        }
      });
  }, []);

  const handleConnect = () => connect({ connector: injected() });

  const handleSignIn = async () => {
    if (!address) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await signIn(address, (msg) => signMessageAsync({ account: address, message: msg }));
      setUser(result.user);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    clearAuth();
    setUser(null);
    setShowMenu(false);
  };

  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Wallet className="w-4 h-4" />
          {isConnecting ? 'Conectando...' : 'Conectar Billetera'}
        </button>
        {connectError && (
          <span className="text-xs text-red-500 max-w-50 text-right">
            {connectError.message.toLowerCase().includes('provider') ||
             connectError.message.toLowerCase().includes('not found') ||
             connectError.message.toLowerCase().includes('injected')
              ? 'No se detectó billetera. Instalá MetaMask.'
              : connectError.message}
          </span>
        )}
      </div>
    );
  }

  if (isConnected && !user) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 font-mono">{shortAddress(address!)}</span>
          <button
            onClick={handleSignIn}
            disabled={authLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {authLoading ? 'Firmando...' : 'Iniciar Sesión'}
          </button>
        </div>
        {authError && (
          <span className="text-xs text-red-500 max-w-55 text-right">{authError}</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
          {user?.nombre?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="hidden sm:block max-w-30 truncate">
          {user?.nombre || shortAddress(address!)}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs text-slate-400">Conectado como</p>
              <p className="text-sm font-medium text-slate-900 truncate font-mono">
                {shortAddress(address!)}
              </p>
            </div>
            <div className="py-1">
              {user?.rol === 'ADMIN' ? (
                <a href="/admin" onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <ShieldCheck className="w-4 h-4 text-slate-400" /> Panel de Disputas
                </a>
              ) : (
                <>
                  <a href="/profile" onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <UserIcon className="w-4 h-4 text-slate-400" /> Mi Perfil
                  </a>
                  <a href="/sell" onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Tag className="w-4 h-4 text-slate-400" /> Vender prenda
                  </a>
                  <a href="/catalog" onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <LayoutGrid className="w-4 h-4 text-slate-400" /> Catálogo
                  </a>
                </>
              )}
            </div>
            <div className="border-t border-slate-100 py-1">
              <button onClick={handleDisconnect}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Desconectar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

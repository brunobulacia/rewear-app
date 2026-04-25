'use client';

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState, useEffect } from 'react';
import { signIn, clearAuth, getStoredUser, getStoredToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from '@/types';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { mutate: connect, error: connectError, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.get<User>('/users/me')
      .then((u) => setUser(u))
      .catch(() => { clearAuth(); setUser(null); });
  }, []);

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const handleSignIn = async () => {
    if (!address) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await signIn(address, (msg) => signMessageAsync({ account: address, message: msg }));
      setUser(result.user);
    } catch (err: unknown) {
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
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {isConnecting ? 'Conectando...' : 'Conectar Billetera'}
        </button>
        {connectError && (
          <span className="text-xs text-red-500 max-w-50 text-right">
            {connectError.message.toLowerCase().includes('provider') ||
             connectError.message.toLowerCase().includes('not found') ||
             connectError.message.toLowerCase().includes('injected')
              ? 'No se detectó billetera. Instalá MetaMask o activá Brave Wallet.'
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
          <span className="text-sm text-gray-500 font-mono">{shortAddress(address!)}</span>
          <button
            onClick={handleSignIn}
            disabled={authLoading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">
          {user?.nombre?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="hidden sm:block">{user?.nombre || shortAddress(address!)}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowMenu(false)}>
            Mi Perfil
          </a>
          <a href="/sell" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowMenu(false)}>
            Vender prenda
          </a>
          <a href="/catalog" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowMenu(false)}>
            Catálogo
          </a>
          <hr className="my-1" />
          <button onClick={handleDisconnect} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            Desconectar
          </button>
        </div>
      )}
    </div>
  );
}

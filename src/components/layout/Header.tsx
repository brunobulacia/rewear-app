'use client';

import Link from 'next/link';
import { ConnectWallet } from '@/components/web3/ConnectWallet';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RW</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ReWear</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/catalog"
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Catálogo
            </Link>
            <Link
              href="/sell"
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Vender
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Mi Perfil
            </Link>
          </nav>

          {/* Wallet */}
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}

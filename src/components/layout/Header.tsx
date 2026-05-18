'use client';

import Link from 'next/link';
import { ConnectWallet } from '@/components/web3/ConnectWallet';
import { Shirt } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shirt className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">ReWear</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/catalog', label: 'Catálogo' },
              { href: '/sell',    label: 'Vender' },
              { href: '/messages', label: 'Mensajes' },
              { href: '/profile', label: 'Mi Perfil' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}

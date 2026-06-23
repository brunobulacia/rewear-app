import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/providers/web3-provider';
import { Header } from '@/components/layout/Header';
import { TermsModal } from '@/components/TermsModal';



export const metadata: Metadata = {
  title: 'ReWear - Moda Circular Verificada',
  description: 'Compra y vende ropa de segunda mano verificada con IA y blockchain',
  icons : {icon: '/icon.ico'}
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-slate-50">
        <Web3Provider>
          <TermsModal />
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
              ReWear © 2025 — Plataforma Descentralizada de Moda Circular
            </div>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}

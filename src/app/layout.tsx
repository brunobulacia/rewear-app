import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/providers/web3-provider';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'ReWear - Moda Circular Verificada',
  description: 'Compra y vende ropa de segunda mano verificada con IA y blockchain',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Web3Provider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
              ReWear © 2024 — Plataforma Descentralizada de Moda Circular
            </div>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}

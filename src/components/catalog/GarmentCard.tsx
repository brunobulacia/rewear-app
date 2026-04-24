import { Garment } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

interface GarmentCardProps {
  garment: Garment;
}

const wearColors: Record<string, string> = {
  Excelente: 'bg-green-100 text-green-700',
  'Muy bueno': 'bg-blue-100 text-blue-700',
  Bueno: 'bg-yellow-100 text-yellow-700',
};

export function GarmentCard({ garment }: GarmentCardProps) {
  const imageUrl = garment.imagenes[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400';
  const wearLevel = garment.verification?.wearLevel;

  return (
    <Link href={`/garment/${garment.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
        {/* Imagen */}
        <div className="relative h-56 bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={garment.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Badge verificado */}
          <div className="absolute top-2 left-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            ✓ Verificado
          </div>
          {wearLevel && (
            <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-medium ${wearColors[wearLevel] || 'bg-gray-100 text-gray-700'}`}>
              {wearLevel}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
            {garment.titulo}
          </h3>

          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            {garment.marca && <span>{garment.marca}</span>}
            {garment.marca && garment.talla && <span>·</span>}
            {garment.talla && <span>Talla {garment.talla}</span>}
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-gray-900">
              Bs. {garment.precio.toFixed(0)}
            </span>
            {garment.verification?.authenticityPct && (
              <span className="text-xs text-gray-400">
                {garment.verification.authenticityPct.toFixed(0)}% auténtico
              </span>
            )}
          </div>

          {/* Seller */}
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-[10px]">
              {garment.seller.nombre?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="truncate">
              {garment.seller.nombre || `${garment.seller.walletAddress.slice(0, 8)}...`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

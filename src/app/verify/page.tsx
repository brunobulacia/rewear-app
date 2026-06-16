'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert, Upload, Loader2, Fingerprint } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '';

interface VerifyResult {
  registered: boolean;
  imageHash: string;
  garment?: {
    id: string;
    titulo: string;
    marca: string | null;
    estado: string;
    nftTokenId: string | null;
    imagen: string | null;
    sellerWallet: string | null;
    verification: { wearLevel: string | null; authenticityPct: number | null; dictamen: string | null } | null;
    createdAt: string;
  };
}

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');

  const onPick = (f: File | null) => {
    setFile(f);
    setResult(null);
    setError('');
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const verify = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const body = new FormData();
      body.append('images', file);
      const res = await fetch(`${API_BASE}/garments/verify-image`, { method: 'POST', body });
      if (!res.ok) throw new Error('No se pudo verificar la imagen.');
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al verificar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Fingerprint className="w-6 h-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-900">Verificar autenticidad</h1>
      </div>
      <p className="text-slate-500 text-sm mb-6">
        Subí la foto de una prenda y comprobá si está registrada en ReWear con su pasaporte digital
        en blockchain. Comparamos la <strong>huella digital (SHA-256)</strong> de la imagen contra
        el sistema.
      </p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <label
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-indigo-300 transition-colors"
        >
          {preview ? (
            <img src={preview} alt="Vista previa" className="max-h-56 rounded-lg object-contain" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-300" />
              <span className="text-sm text-slate-500">Hacé clic para elegir una imagen</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
        </label>

        <button
          onClick={verify}
          disabled={!file || loading}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {loading ? 'Verificando…' : 'Verificar imagen'}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}
      </div>

      {/* Resultado */}
      {result && (
        <div className="mt-6">
          {result.registered && result.garment ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h2 className="text-lg font-bold text-emerald-800">Prenda registrada ✓</h2>
              </div>
              <div className="flex gap-4">
                {result.garment.imagen && (
                  <img src={result.garment.imagen} alt={result.garment.titulo}
                    className="w-20 h-20 rounded-lg object-cover border border-emerald-200" />
                )}
                <div className="flex-1 text-sm space-y-1">
                  <p className="font-semibold text-slate-900">{result.garment.titulo}</p>
                  {result.garment.marca && <p className="text-slate-500">{result.garment.marca}</p>}
                  {result.garment.verification?.authenticityPct != null && (
                    <p className="text-emerald-700">
                      {result.garment.verification.authenticityPct.toFixed(0)}% autenticidad · {result.garment.verification.wearLevel}
                    </p>
                  )}
                  {result.garment.nftTokenId ? (
                    <p className="text-slate-700">
                      Pasaporte NFT: <strong>#{result.garment.nftTokenId}</strong>
                      {NFT_CONTRACT && (
                        <>
                          {' · '}
                          <a
                            href={`https://sepolia.etherscan.io/token/${NFT_CONTRACT}?a=${result.garment.nftTokenId}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            ver en blockchain
                          </a>
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="text-amber-700">Registrada pero sin pasaporte NFT (no superó la verificación).</p>
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400 font-mono break-all">
                SHA-256: {result.imageHash}
              </p>
              {result.garment.nftTokenId && (
                <Link href={`/garment/${result.garment.id}`}
                  className="mt-4 inline-block text-sm text-indigo-600 hover:underline font-medium">
                  Ver prenda completa →
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
                <h2 className="text-lg font-bold text-amber-800">No registrada</h2>
              </div>
              <p className="text-sm text-amber-700">
                Esta imagen no está registrada en ReWear. No tiene pasaporte digital ni NFT asociado.
              </p>
              <p className="mt-4 text-xs text-slate-400 font-mono break-all">
                SHA-256: {result.imageHash}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { api } from '@/lib/api';
import { getStoredToken } from '@/lib/auth';
import { useCreateAndFund, useWaitForEscrowTx } from '@/lib/escrow';
import { GarmentDetail } from '@/types';

// Bs por 1 ETH de Sepolia. Default alto a propósito: si la env no se setea en el
// deploy, el monto resultante es chico (afordable en testnet). Un default bajo
// (ej. 3.5) haría que un producto de Bs 250 intente enviar ~71 ETH y rompa la compra.
const BOB_PER_ETH = parseFloat(process.env.NEXT_PUBLIC_BOB_PER_ETH || '20000');

type Step = 'review' | 'signing' | 'confirming' | 'registering' | 'success' | 'error';

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const isWrongNetwork = isConnected && chain?.id !== sepolia.id;

  const [garment, setGarment] = useState<GarmentDetail | null>(null);
  const [step, setStep] = useState<Step>('review');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedTxHash, setConfirmedTxHash] = useState<string | null>(null);

  const { fund, hash, isPending, error: writeError } = useCreateAndFund();
  const { data: receipt, isLoading: isConfirming } = useWaitForEscrowTx(hash);

  // Load garment
  useEffect(() => {
    api.get<GarmentDetail>(`/garments/${id}`)
      .then(setGarment)
      .catch(() => {
        setErrorMsg('No se pudo cargar el producto.');
        setStep('error');
      });
  }, [id]);

  // Track step from pending/hash states
  useEffect(() => {
    if (isPending) setStep('signing');
  }, [isPending]);

  useEffect(() => {
    if (hash && !isPending) setStep('confirming');
  }, [hash, isPending]);

  // Propagate write errors
  useEffect(() => {
    if (!writeError) return;
    const msg = writeError.message.split('\n')[0].replace(/^.*: /, '');
    setErrorMsg(msg || 'Error al enviar la transacción.');
    setStep('error');
  }, [writeError]);

  // On receipt → register in API
  useEffect(() => {
    if (!receipt || !garment) return;
    setStep('registering');

    // TradeFunded event: topics[0]=sig, topics[1]=tradeId (indexed bytes32)
    const escrowLog = receipt.logs.find((l) => l.topics.length >= 2);
    const escrowTradeId = escrowLog?.topics[1] ?? '';

    api
      .post<{ id: string }>('/transactions', {
        garmentId: garment.id,
        escrowTradeId,
        escrowTxHash: receipt.transactionHash,
        amountMatic: garment.precio / BOB_PER_ETH,
      })
      .then(() => {
        setConfirmedTxHash(receipt.transactionHash);
        setStep('success');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message || 'Error al registrar la transacción.');
        setStep('error');
      });
  }, [receipt, garment]);

  const handlePay = () => {
    if (!garment || !address) return;
    const nftTokenId = garment.nftTokenId ? BigInt(garment.nftTokenId) : BigInt(0);
    const maticStr = (garment.precio / BOB_PER_ETH).toFixed(6);
    fund(garment.seller.walletAddress as `0x${string}`, garment.id, nftTokenId, maticStr);
  };

  const token = getStoredToken();
  const isAuthed = isConnected && !!token;
  const isBusy = step === 'signing' || step === 'confirming' || step === 'registering';
  const maticAmount = garment ? (garment.precio / BOB_PER_ETH).toFixed(4) : '—';

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === 'success' && garment) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Tu pago está retenido en el escrow. Cuando recibas el producto confirmá la entrega
          para liberar los fondos al vendedor.
        </p>
        <div className="bg-gray-50 rounded-xl px-5 py-4 text-left mb-6 text-sm space-y-1.5">
          <p className="text-gray-500">
            Producto: <span className="text-gray-900 font-medium">{garment.titulo}</span>
          </p>
          <p className="text-gray-500">
            Monto: <span className="text-gray-900 font-medium">{maticAmount} ETH</span>
          </p>
          {confirmedTxHash && (
            <p className="text-gray-400 font-mono text-xs truncate">
              Tx: {confirmedTxHash}
            </p>
          )}
        </div>
        <Link
          href="/profile"
          className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors text-center"
        >
          Ver mis transacciones
        </Link>
        <Link
          href="/catalog"
          className="block mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Seguir comprando
        </Link>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <nav className="mb-6 text-sm text-gray-500 flex items-center gap-2">
        <Link href="/catalog" className="hover:text-emerald-600 transition-colors">Catálogo</Link>
        <span>/</span>
        {garment && (
          <>
            <Link href={`/cart?garmentId=${garment.id}`} className="hover:text-emerald-600 transition-colors">
              Carrito
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900">Pago</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* Resumen del pedido */}
      {garment ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="flex gap-4 p-5">
            <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={garment.imagenes[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400'}
                alt={garment.titulo}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">{garment.titulo}</h2>
              {garment.marca && (
                <p className="text-sm text-gray-500">
                  {garment.marca}{garment.talla ? ` · ${garment.talla}` : ''}
                </p>
              )}
              <span className="mt-1 inline-block text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                ✓ Verificado
              </span>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-gray-900">Bs. {garment.precio.toFixed(0)}</p>
              <p className="text-xs text-gray-400">{maticAmount} ETH</p>
            </div>
          </div>
          <hr className="border-gray-100" />
          <div className="px-5 py-3 text-sm space-y-1.5">
            <div className="flex justify-between text-gray-500">
              <span>Precio del producto</span>
              <span>Bs. {garment.precio.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Comisión plataforma (3%) · la paga el vendedor</span>
              <span>Bs. {(garment.precio * 0.03).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>El vendedor recibe</span>
              <span>Bs. {(garment.precio * 0.97).toFixed(2)}</span>
            </div>
            <hr className="border-gray-100" />
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total a pagar</span>
              <span>{maticAmount} ETH</span>
            </div>
            <p className="text-xs text-gray-400">Pagás el precio completo; la comisión se descuenta al vendedor.</p>
          </div>
        </div>
      ) : (
        !errorMsg && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 text-center text-gray-400 text-sm">
            Cargando producto...
          </div>
        )
      )}

      {/* Wallet / auth warnings */}
      {!isConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
          Conectá tu billetera para continuar con el pago.
        </div>
      )}
      {isWrongNetwork && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>MetaMask está en <strong>{chain?.name}</strong>. Necesitás cambiar a <strong>Sepolia</strong>.</span>
          <button
            onClick={() => switchChain({ chainId: sepolia.id })}
            className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Cambiar a Sepolia
          </button>
        </div>
      )}
      {isConnected && !token && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
          Iniciá sesión con tu billetera antes de pagar.
        </div>
      )}

      {/* Error message */}
      {step === 'error' && errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Progress indicator */}
      {isBusy && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700 flex items-center gap-3">
          <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          <span>
            {step === 'signing' && 'Esperando firma en tu billetera...'}
            {step === 'confirming' && 'Confirmando transacción en la blockchain...'}
            {step === 'registering' && 'Registrando compra en el sistema...'}
          </span>
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={step === 'error' ? () => { setStep('review'); setErrorMsg(''); } : handlePay}
        disabled={!isAuthed || !garment || isBusy || isWrongNetwork}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm transition-colors"
      >
        {isBusy
          ? 'Procesando...'
          : step === 'error'
            ? 'Reintentar'
            : `Pagar ${maticAmount} ETH con escrow`}
      </button>

      <Link
        href={garment ? `/cart?garmentId=${garment.id}` : '/catalog'}
        className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3 transition-colors"
      >
        ← Volver al carrito
      </Link>

      <p className="mt-4 text-xs text-center text-gray-400">
        Los fondos se bloquean en el contrato hasta que confirmes la entrega.
        La comisión del 3% se descuenta al vendedor al momento de liberar los fondos.
      </p>
    </div>
  );
}

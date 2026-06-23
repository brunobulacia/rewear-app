'use client';

import { useState, useEffect } from 'react';
import { getStoredToken } from '@/lib/auth';
import { ShieldCheck, FileText } from 'lucide-react';

const STORAGE_KEY = 'rewear_terms_accepted';

/**
 * Modal de Términos y Condiciones. Se muestra al ingresar a la plataforma
 * cuando el visitante NO tiene una sesión iniciada y todavía no aceptó los
 * términos. Requiere marcar la casilla y aceptar para continuar.
 */
export function TermsModal() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
    const accepted = localStorage.getItem(STORAGE_KEY) === 'true';
    const loggedIn = !!getStoredToken();
    if (!accepted && !loggedIn) setShow(true);
  }, []);

  const accept = () => {
    if (!checked) return;
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  // Evita el desajuste de hidratación: no se renderiza en SSR ni antes de montar.
  if (!mounted || !show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-5 flex items-center gap-3 shrink-0">
          <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </span>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Términos y Condiciones</h2>
            <p className="text-indigo-200 text-xs">Leé y aceptá antes de usar ReWear</p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5 overflow-y-auto text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            Bienvenido/a a <strong className="text-slate-900">ReWear</strong>, la plataforma de moda circular para
            comprar y vender ropa de segunda mano de forma confiable. Al usar la plataforma, aceptás los
            siguientes términos:
          </p>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">1. La plataforma</h3>
            <p>ReWear es un marketplace que conecta a compradores y vendedores de ropa de segunda mano, actuando
            como <strong>intermediario de confianza</strong>. No es propietaria de las prendas publicadas.</p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">2. Cuenta y billetera</h3>
            <p>El acceso se realiza conectando una <strong>billetera digital</strong>. Sos responsable de la
            seguridad de tu billetera y de las operaciones que realices con ella.</p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">3. Compras y ventas</h3>
            <p>Cada prenda se <strong>verifica con inteligencia artificial</strong> y recibe un pasaporte digital
            (NFT). El pago queda <strong>retenido en custodia (escrow)</strong> hasta que confirmás la entrega.
            Si surge un problema, podés abrir una <strong>disputa</strong> o cancelar para recuperar tu pago.</p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">4. Conductas prohibidas</h3>
            <p>Está prohibido publicar prendas falsas o robadas, realizar fraudes o usar la plataforma para fines
            ilícitos. El incumplimiento puede derivar en la suspensión de la cuenta.</p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">5. Blockchain</h3>
            <p>El pasaporte NFT y el historial de cada prenda quedan registrados de forma
            <strong> pública e inmutable</strong> en la red blockchain, por lo que esa información no puede
            eliminarse.</p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">6. Privacidad</h3>
            <p>Recopilamos tu dirección de billetera, nombre, correo, prendas publicadas e historial de
            transacciones, con el único fin de operar la plataforma y mejorar el servicio.</p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">7. Limitación de responsabilidad</h3>
            <p>ReWear no se responsabiliza por el estado real de las prendas más allá de la verificación
            automática, ni por acuerdos realizados fuera de la plataforma.</p>
          </div>

          <p className="text-xs text-slate-400">
            Para consultas: <span className="text-indigo-600">rewearboscz@gmail.com</span>
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 shrink-0 bg-white">
          <label className="flex items-start gap-2.5 cursor-pointer mb-3 select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
            />
            <span className="text-sm text-slate-600">
              He leído y acepto los <strong className="text-slate-900">Términos y Condiciones</strong> y la
              <strong className="text-slate-900"> Política de Privacidad</strong> de ReWear.
            </span>
          </label>
          <button
            onClick={accept}
            disabled={!checked}
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            <ShieldCheck className="w-4 h-4" /> Aceptar y continuar
          </button>
        </div>
      </div>
    </div>
  );
}

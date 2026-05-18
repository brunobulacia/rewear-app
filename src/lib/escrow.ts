/**
 * Helpers para interactuar con el contrato ReWearEscrow desde el frontend.
 * Usa wagmi v3 + viem para enviar transacciones desde la wallet del usuario.
 */

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import type { Abi } from 'viem';
import EscrowAbiJson from './escrow-abi.json';

const ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || '') as `0x${string}`;
const EscrowAbi = EscrowAbiJson as Abi;

// ─────────────────────────────────────────────────────────────
//  Hook: fondear el escrow (comprar prenda)
// ─────────────────────────────────────────────────────────────

export function useCreateAndFund() {
  const { address, chain } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const fund = (
    sellerAddress: `0x${string}`,
    garmentId: string,
    nftTokenId: bigint,
    amountMatic: string,   // ej: "0.05"
  ) => {
    writeContract({
      address: ESCROW_ADDRESS,
      abi: EscrowAbi,
      functionName: 'createAndFund',
      args: [sellerAddress, garmentId, nftTokenId],
      value: parseEther(amountMatic),
      account: address,
      chain,
    });
  };

  return { fund, hash, isPending, error };
}

// ─────────────────────────────────────────────────────────────
//  Hook: confirmar entrega
// ─────────────────────────────────────────────────────────────

export function useConfirmDelivery() {
  const { address, chain } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const confirm = (tradeId: `0x${string}`) => {
    writeContract({
      address: ESCROW_ADDRESS,
      abi: EscrowAbi,
      functionName: 'confirmDelivery',
      args: [tradeId],
      account: address,
      chain,
    });
  };

  return { confirm, hash, isPending, error };
}

// ─────────────────────────────────────────────────────────────
//  Hook: abrir disputa
// ─────────────────────────────────────────────────────────────

export function useOpenDispute() {
  const { address, chain } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const dispute = (tradeId: `0x${string}`) => {
    writeContract({
      address: ESCROW_ADDRESS,
      abi: EscrowAbi,
      functionName: 'openDispute',
      args: [tradeId],
      account: address,
      chain,
    });
  };

  return { dispute, hash, isPending, error };
}

// ─────────────────────────────────────────────────────────────
//  Hook: esperar confirmación de tx
// ─────────────────────────────────────────────────────────────

export function useWaitForEscrowTx(hash: `0x${string}` | undefined) {
  return useWaitForTransactionReceipt({ hash });
}

// ─────────────────────────────────────────────────────────────
//  Hook: leer trade por garmentId
// ─────────────────────────────────────────────────────────────

export function useTradeByGarment(garmentId: string | undefined) {
  return useReadContract({
    address: ESCROW_ADDRESS,
    abi: EscrowAbi,
    functionName: 'getTradeByGarment',
    args: garmentId ? [garmentId] : undefined,
    query: { enabled: !!garmentId && !!ESCROW_ADDRESS },
  });
}

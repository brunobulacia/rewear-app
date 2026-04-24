import { api } from './api';
import { User } from '@/types';

const TOKEN_KEY = 'rewear_token';
const USER_KEY = 'rewear_user';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function signIn(
  address: string,
  signMessage: (message: string) => Promise<string>,
): Promise<{ token: string; user: User }> {
  // 1. Pedir nonce
  const { nonce } = await api.get<{ nonce: string }>(`/auth/nonce?address=${address}`);

  // 2. Firmar con la billetera
  const signature = await signMessage(nonce);

  // 3. Verificar firma y obtener JWT
  const result = await api.post<{ token: string; user: User }>('/auth/verify', {
    address,
    signature,
  });

  // 4. Persistir
  localStorage.setItem(TOKEN_KEY, result.token);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));

  return result;
}

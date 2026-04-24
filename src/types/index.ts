export interface User {
  id: string;
  walletAddress: string;
  nombre: string | null;
  email: string | null;
  ubicacion: string | null;
  avatar: string | null;
  rol: 'BUYER' | 'SELLER' | 'ADMIN';
  createdAt: string;
}

export interface Verification {
  wearLevel: string | null;
  authenticityPct: number | null;
}

export interface VerificationDetail extends Verification {
  aiScore: number | null;
  dictamen: string | null;
  createdAt: string;
}

export interface GarmentDetail {
  id: string;
  titulo: string;
  descripcion: string | null;
  precio: number;
  marca: string | null;
  talla: string | null;
  categoria: string | null;
  estilo: string | null;
  imagenes: string[];
  estado: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SOLD';
  verificationStatus: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  nftTokenId: string | null;
  createdAt: string;
  seller: Pick<User, 'id' | 'walletAddress' | 'nombre' | 'avatar'>;
  verification: VerificationDetail | null;
}

export interface Garment {
  id: string;
  titulo: string;
  precio: number;
  marca: string | null;
  talla: string | null;
  categoria: string | null;
  imagenes: string[];
  verificationStatus: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  seller: Pick<User, 'id' | 'walletAddress' | 'nombre' | 'avatar'>;
  verification: Verification | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

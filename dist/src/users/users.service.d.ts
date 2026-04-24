import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        id: string;
        walletAddress: string;
        nombre: string;
        email: string;
        ubicacion: string;
        avatar: string;
        rol: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        walletAddress: string;
        nombre: string;
        email: string;
        ubicacion: string;
        avatar: string;
        rol: import(".prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPublicProfile(walletAddress: string): Promise<{
        id: string;
        walletAddress: string;
        nombre: string;
        avatar: string;
        rol: import(".prisma/client").$Enums.Role;
        createdAt: Date;
        garments: {
            id: string;
            titulo: string;
            marca: string;
            talla: string;
            precio: number;
            imagenes: string[];
        }[];
    }>;
}

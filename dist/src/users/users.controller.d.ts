import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(user: {
        userId: string;
    }): Promise<{
        id: string;
        walletAddress: string;
        nombre: string;
        email: string;
        ubicacion: string;
        avatar: string;
        rol: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    updateMe(user: {
        userId: string;
    }, dto: UpdateProfileDto): Promise<{
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
    getPublicProfile(address: string): Promise<{
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

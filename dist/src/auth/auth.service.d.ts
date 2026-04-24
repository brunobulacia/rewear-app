import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    getNonce(address: string): Promise<{
        nonce: string;
    }>;
    verifySignature(address: string, signature: string): Promise<{
        token: string;
        user: any;
    }>;
}

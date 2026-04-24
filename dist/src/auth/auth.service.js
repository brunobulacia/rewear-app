"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const ethers_1 = require("ethers");
const uuid_1 = require("uuid");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async getNonce(address) {
        const normalized = address.toLowerCase();
        let user = await this.prisma.user.findUnique({
            where: { walletAddress: normalized },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: { walletAddress: normalized },
            });
        }
        await this.prisma.authNonce.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true },
        });
        const nonce = `ReWear Sign-In\n\nNonce: ${(0, uuid_1.v4)()}\nTimestamp: ${Date.now()}`;
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await this.prisma.authNonce.create({
            data: { userId: user.id, nonce, expiresAt },
        });
        return { nonce };
    }
    async verifySignature(address, signature) {
        const normalized = address.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { walletAddress: normalized },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        }
        const nonceRecord = await this.prisma.authNonce.findFirst({
            where: {
                userId: user.id,
                used: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!nonceRecord) {
            throw new common_1.UnauthorizedException('Nonce inválido o expirado');
        }
        let recoveredAddress;
        try {
            recoveredAddress = ethers_1.ethers.verifyMessage(nonceRecord.nonce, signature);
        }
        catch {
            throw new common_1.BadRequestException('Firma inválida');
        }
        if (recoveredAddress.toLowerCase() !== normalized) {
            throw new common_1.UnauthorizedException('La firma no coincide con la dirección');
        }
        await this.prisma.authNonce.update({
            where: { id: nonceRecord.id },
            data: { used: true },
        });
        const token = this.jwtService.sign({
            sub: user.id,
            address: normalized,
        });
        return {
            token,
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                nombre: user.nombre,
                email: user.email,
                ubicacion: user.ubicacion,
                avatar: user.avatar,
                rol: user.rol,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
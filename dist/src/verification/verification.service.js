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
var VerificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const DICTAMENES = [
    'Análisis de IA completado. La prenda presenta características visuales consistentes con la marca declarada. Las costuras, etiquetas y materiales son auténticos según los patrones de referencia del modelo de visión. Se aprueba su publicación.',
    'Verificación exitosa. El estado de conservación es consistente con el nivel declarado por el vendedor. No se detectan signos de deterioro significativo ni alteraciones en los materiales. Prenda apta para el marketplace ReWear.',
    'Análisis completado con resultado positivo. La prenda ha sido verificada como auténtica mediante análisis espectral de imagen y comparación con base de datos de referencia. El desgaste observado es uniforme y coherente.',
    'Dictamen favorable. Las imágenes analizadas confirman la autenticidad de la prenda y su buen estado general. Los patrones de tejido, costuras y etiquetas coinciden con los estándares de la marca. Aprobada para emisión de pasaporte digital.',
];
const WEAR_LEVELS = ['Excelente', 'Muy bueno', 'Bueno'];
let VerificationService = VerificationService_1 = class VerificationService {
    constructor(prisma, blockchain, config) {
        this.prisma = prisma;
        this.blockchain = blockchain;
        this.config = config;
        this.logger = new common_1.Logger(VerificationService_1.name);
    }
    async runPipeline(garmentId) {
        try {
            await this.markInProgress(garmentId);
            await this.simulateAIDelay();
            const { aiScore, authenticityPct, wearLevel, dictamen } = this.generateAIResult();
            await this.saveVerification(garmentId, { aiScore, authenticityPct, wearLevel, dictamen });
            await this.approveGarment(garmentId);
            await this.mintNFT(garmentId);
        }
        catch (err) {
            this.logger.error(`Pipeline fallido para prenda ${garmentId}`, err);
            await this.prisma.garment
                .update({
                where: { id: garmentId },
                data: { verificationStatus: 'REJECTED' },
            })
                .catch(() => { });
        }
    }
    async markInProgress(garmentId) {
        await this.prisma.garment.update({
            where: { id: garmentId },
            data: { verificationStatus: 'IN_PROGRESS' },
        });
        this.logger.log(`Verificando prenda ${garmentId}...`);
    }
    simulateAIDelay() {
        return new Promise((r) => setTimeout(r, 3000));
    }
    generateAIResult() {
        const aiScore = 78 + Math.random() * 20;
        const authenticityPct = 82 + Math.random() * 16;
        const wearLevel = WEAR_LEVELS[Math.floor(Math.random() * WEAR_LEVELS.length)];
        const dictamen = DICTAMENES[Math.floor(Math.random() * DICTAMENES.length)];
        return { aiScore, authenticityPct, wearLevel, dictamen };
    }
    async saveVerification(garmentId, data) {
        await this.prisma.verification.create({
            data: { garmentId, ...data },
        });
    }
    async approveGarment(garmentId) {
        await this.prisma.garment.update({
            where: { id: garmentId },
            data: { verificationStatus: 'APPROVED', estado: 'VERIFIED' },
        });
        this.logger.log(`Prenda ${garmentId} aprobada`);
    }
    async mintNFT(garmentId) {
        const garment = await this.prisma.garment.findUnique({
            where: { id: garmentId },
            include: { seller: true },
        });
        if (!garment)
            return;
        const apiBase = this.config.get('API_BASE_URL') || 'http://localhost:4000/api';
        const tokenURI = `${apiBase}/garments/${garmentId}/metadata`;
        const tokenId = await this.blockchain.mintPassport(garment.seller.walletAddress, garmentId, tokenURI);
        if (tokenId) {
            await this.prisma.garment.update({
                where: { id: garmentId },
                data: { nftTokenId: tokenId },
            });
            this.logger.log(`NFT #${tokenId} registrado para prenda ${garmentId}`);
        }
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = VerificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        blockchain_service_1.BlockchainService,
        config_1.ConfigService])
], VerificationService);
//# sourceMappingURL=verification.service.js.map
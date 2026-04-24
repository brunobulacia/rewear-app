import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';

const DICTAMENES = [
  'Análisis de IA completado. La prenda presenta características visuales consistentes con la marca declarada. Las costuras, etiquetas y materiales son auténticos según los patrones de referencia del modelo de visión. Se aprueba su publicación.',
  'Verificación exitosa. El estado de conservación es consistente con el nivel declarado por el vendedor. No se detectan signos de deterioro significativo ni alteraciones en los materiales. Prenda apta para el marketplace ReWear.',
  'Análisis completado con resultado positivo. La prenda ha sido verificada como auténtica mediante análisis espectral de imagen y comparación con base de datos de referencia. El desgaste observado es uniforme y coherente.',
  'Dictamen favorable. Las imágenes analizadas confirman la autenticidad de la prenda y su buen estado general. Los patrones de tejido, costuras y etiquetas coinciden con los estándares de la marca. Aprobada para emisión de pasaporte digital.',
];

const WEAR_LEVELS = ['Excelente', 'Muy bueno', 'Bueno'];

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private prisma: PrismaService,
    private blockchain: BlockchainService,
    private config: ConfigService,
  ) {}

  /**
   * Pipeline completo: IA → aprobación → mint NFT.
   * Se llama de forma asíncrona (fire-and-forget) desde el controller.
   */
  async runPipeline(garmentId: string): Promise<void> {
    try {
      await this.markInProgress(garmentId);
      await this.simulateAIDelay();
      const { aiScore, authenticityPct, wearLevel, dictamen } =
        this.generateAIResult();
      await this.saveVerification(garmentId, { aiScore, authenticityPct, wearLevel, dictamen });
      await this.approveGarment(garmentId);
      await this.mintNFT(garmentId);
    } catch (err) {
      this.logger.error(`Pipeline fallido para prenda ${garmentId}`, err);
      await this.prisma.garment
        .update({
          where: { id: garmentId },
          data: { verificationStatus: 'REJECTED' },
        })
        .catch(() => {});
    }
  }

  private async markInProgress(garmentId: string) {
    await this.prisma.garment.update({
      where: { id: garmentId },
      data: { verificationStatus: 'IN_PROGRESS' },
    });
    this.logger.log(`Verificando prenda ${garmentId}...`);
  }

  private simulateAIDelay(): Promise<void> {
    return new Promise((r) => setTimeout(r, 3000));
  }

  private generateAIResult() {
    const aiScore = 78 + Math.random() * 20;
    const authenticityPct = 82 + Math.random() * 16;
    const wearLevel = WEAR_LEVELS[Math.floor(Math.random() * WEAR_LEVELS.length)];
    const dictamen = DICTAMENES[Math.floor(Math.random() * DICTAMENES.length)];
    return { aiScore, authenticityPct, wearLevel, dictamen };
  }

  private async saveVerification(
    garmentId: string,
    data: { aiScore: number; authenticityPct: number; wearLevel: string; dictamen: string },
  ) {
    await this.prisma.verification.create({
      data: { garmentId, ...data },
    });
  }

  private async approveGarment(garmentId: string) {
    await this.prisma.garment.update({
      where: { id: garmentId },
      data: { verificationStatus: 'APPROVED', estado: 'VERIFIED' },
    });
    this.logger.log(`Prenda ${garmentId} aprobada`);
  }

  private async mintNFT(garmentId: string) {
    const garment = await this.prisma.garment.findUnique({
      where: { id: garmentId },
      include: { seller: true },
    });
    if (!garment) return;

    const apiBase =
      this.config.get<string>('API_BASE_URL') || 'http://localhost:4000/api';
    const tokenURI = `${apiBase}/garments/${garmentId}/metadata`;

    const tokenId = await this.blockchain.mintPassport(
      garment.seller.walletAddress,
      garmentId,
      tokenURI,
    );

    if (tokenId) {
      await this.prisma.garment.update({
        where: { id: garmentId },
        data: { nftTokenId: tokenId },
      });
      this.logger.log(`NFT #${tokenId} registrado para prenda ${garmentId}`);
    }
  }
}

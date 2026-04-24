import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
export declare class VerificationService {
    private prisma;
    private blockchain;
    private config;
    private readonly logger;
    constructor(prisma: PrismaService, blockchain: BlockchainService, config: ConfigService);
    runPipeline(garmentId: string): Promise<void>;
    private markInProgress;
    private simulateAIDelay;
    private generateAIResult;
    private saveVerification;
    private approveGarment;
    private mintNFT;
}

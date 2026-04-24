import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, BlockchainModule],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}

import { Module } from '@nestjs/common';
import { GarmentsController } from './garments.controller';
import { GarmentsService } from './garments.service';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [VerificationModule],
  controllers: [GarmentsController],
  providers: [GarmentsService],
})
export class GarmentsModule {}

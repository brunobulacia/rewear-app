import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifySignatureDto } from './dto/verify-signature.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('nonce')
  async getNonce(@Query('address') address: string) {
    if (!address) throw new BadRequestException('address es requerido');
    return this.authService.getNonce(address);
  }

  @Post('verify')
  async verify(@Body() dto: VerifySignatureDto) {
    return this.authService.verifySignature(dto.address, dto.signature);
  }
}

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async getNonce(address: string): Promise<{ nonce: string }> {
    const normalized = address.toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { walletAddress: normalized },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { walletAddress: normalized },
      });
    }

    // Invalidar nonces anteriores no usados
    await this.prisma.authNonce.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const nonce = `ReWear Sign-In\n\nNonce: ${uuidv4()}\nTimestamp: ${Date.now()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await this.prisma.authNonce.create({
      data: { userId: user.id, nonce, expiresAt },
    });

    return { nonce };
  }

  async verifySignature(address: string, signature: string): Promise<{ token: string; user: any }> {
    const normalized = address.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalized },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
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
      throw new UnauthorizedException('Nonce inválido o expirado');
    }

    // Verificar firma criptográfica
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(nonceRecord.nonce, signature);
    } catch {
      throw new BadRequestException('Firma inválida');
    }

    if (recoveredAddress.toLowerCase() !== normalized) {
      throw new UnauthorizedException('La firma no coincide con la dirección');
    }

    // Marcar nonce como usado
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
}

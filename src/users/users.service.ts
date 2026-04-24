import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        nombre: true,
        email: true,
        ubicacion: true,
        avatar: true,
        rol: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        walletAddress: true,
        nombre: true,
        email: true,
        ubicacion: true,
        avatar: true,
        rol: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async getPublicProfile(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: {
        id: true,
        walletAddress: true,
        nombre: true,
        avatar: true,
        rol: true,
        createdAt: true,
        garments: {
          where: { estado: 'VERIFIED' },
          select: {
            id: true,
            titulo: true,
            precio: true,
            imagenes: true,
            marca: true,
            talla: true,
          },
          take: 12,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}

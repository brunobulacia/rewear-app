import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListGarmentsDto } from './dto/list-garments.dto';
import { CreateGarmentDto } from './dto/create-garment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GarmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGarmentDto, sellerId: string, imagenes: string[]) {
    return this.prisma.garment.create({
      data: {
        ...dto,
        sellerId,
        imagenes,
        verificationStatus: 'PENDING',
        estado: 'PENDING',
      },
      include: {
        seller: {
          select: { id: true, walletAddress: true, nombre: true, avatar: true },
        },
      },
    });
  }

  async findAll(dto: ListGarmentsDto) {
    const { marca, talla, categoria, precioMin, precioMax, q, page = 1, limit = 12 } = dto;

    const where: Prisma.GarmentWhereInput = {
      estado: 'VERIFIED',
      ...(marca && { marca: { contains: marca, mode: 'insensitive' } }),
      ...(talla && { talla }),
      ...(categoria && { categoria: { contains: categoria, mode: 'insensitive' } }),
      ...(q && {
        OR: [
          { titulo: { contains: q, mode: 'insensitive' } },
          { descripcion: { contains: q, mode: 'insensitive' } },
          { marca: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...((precioMin !== undefined || precioMax !== undefined) && {
        precio: {
          ...(precioMin !== undefined && { gte: precioMin }),
          ...(precioMax !== undefined && { lte: precioMax }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.garment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          titulo: true,
          precio: true,
          marca: true,
          talla: true,
          categoria: true,
          imagenes: true,
          verificationStatus: true,
          seller: {
            select: { id: true, walletAddress: true, nombre: true, avatar: true },
          },
          verification: {
            select: { wearLevel: true, authenticityPct: true },
          },
        },
      }),
      this.prisma.garment.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const garment = await this.prisma.garment.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, walletAddress: true, nombre: true, avatar: true },
        },
        verification: true,
      },
    });

    if (!garment) throw new NotFoundException('Prenda no encontrada');
    return garment;
  }

  async findByUser(sellerId: string) {
    return this.prisma.garment.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        verification: {
          select: { wearLevel: true, authenticityPct: true },
        },
      },
    });
  }

  async getMetadata(id: string) {
    const garment = await this.prisma.garment.findUnique({
      where: { id },
      include: {
        seller: { select: { walletAddress: true, nombre: true } },
        verification: true,
      },
    });

    if (!garment) throw new NotFoundException('Prenda no encontrada');

    return {
      name: garment.titulo,
      description: garment.descripcion || `Prenda verificada por ReWear: ${garment.titulo}`,
      image: garment.imagenes[0] || '',
      external_url: `http://localhost:3000/garment/${garment.id}`,
      attributes: [
        { trait_type: 'Marca', value: garment.marca || 'Sin marca' },
        { trait_type: 'Talla', value: garment.talla || 'Única' },
        { trait_type: 'Categoría', value: garment.categoria || 'Otros' },
        { trait_type: 'Estado', value: garment.verification?.wearLevel || 'Verificado' },
        {
          trait_type: 'Autenticidad',
          value: garment.verification?.authenticityPct?.toFixed(1) + '%' || '—',
        },
        {
          trait_type: 'AI Score',
          display_type: 'number',
          value: garment.verification?.aiScore?.toFixed(1) || 0,
        },
        { trait_type: 'Vendedor', value: garment.seller.nombre || garment.seller.walletAddress },
        { trait_type: 'Plataforma', value: 'ReWear' },
        { trait_type: 'Red', value: 'Polygon Amoy' },
      ],
      rewear: {
        garmentId: garment.id,
        nftTokenId: garment.nftTokenId,
        verificationStatus: garment.verificationStatus,
        verificadoEn: garment.verification?.createdAt,
        dictamen: garment.verification?.dictamen,
      },
    };
  }
}

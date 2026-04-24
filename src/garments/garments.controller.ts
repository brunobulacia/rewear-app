import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GarmentsService } from './garments.service';
import { VerificationService } from '../verification/verification.service';
import { ListGarmentsDto } from './dto/list-garments.dto';
import { CreateGarmentDto } from './dto/create-garment.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

const imageStorage = diskStorage({
  destination: './uploads',
  filename: (_, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@Controller('garments')
export class GarmentsController {
  constructor(
    private garmentsService: GarmentsService,
    private verificationService: VerificationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: imageStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new BadRequestException('Solo se aceptan imágenes'), false);
      },
    }),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateGarmentDto,
    @CurrentUser() user: { userId: string; walletAddress: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Se requiere al menos una imagen');
    }

    const apiBase = process.env.API_BASE_URL || 'http://localhost:4000/api';
    const imagenes = files.map((f) => `${apiBase}/uploads/${f.filename}`);

    const garment = await this.garmentsService.create(dto, user.userId, imagenes);

    // Pipeline asíncrono: IA → aprobación → mint NFT
    this.verificationService.runPipeline(garment.id).catch(() => {});

    return garment;
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: { userId: string }) {
    return this.garmentsService.findByUser(user.userId);
  }

  @Get()
  findAll(@Query() dto: ListGarmentsDto) {
    return this.garmentsService.findAll(dto);
  }

  @Get(':id/metadata')
  getMetadata(@Param('id') id: string) {
    return this.garmentsService.getMetadata(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.garmentsService.findOne(id);
  }
}

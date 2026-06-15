import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetService } from './asset.service';

interface RegisterAssetDto {
  tags?: string; // Comma separated tags
}

@Controller('api/v1/assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(
    @UploadedFile() file: any, // Express.Multer.File
    @Body() dto: RegisterAssetDto,
  ) {
    if (!file) {
      throw new BadRequestException('Missing file upload parameter');
    }

    const tags = dto.tags ? dto.tags.split(',').map((t) => t.trim()) : [];

    return this.assetService.registerAsset(
      file.originalname,
      file.size,
      file.mimetype,
      tags,
      file.buffer,
    );
  }

  @Get()
  async getAssets() {
    return this.assetService.getAssets();
  }
}

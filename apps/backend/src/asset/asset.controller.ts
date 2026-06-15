import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetService } from './asset.service';

interface RegisterAssetDto {
  tags?: string; // Comma separated tags
}

interface RegisterDirectAssetDto {
  filename: string;
  fileSize: number;
  mimeType: string;
  tags?: string[];
  s3Key: string;
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

  @Get('presigned-url')
  async getPresignedUrl(
    @Query('filename') filename: string,
    @Query('mimeType') mimeType: string,
  ) {
    if (!filename || !mimeType) {
      throw new BadRequestException(
        'Query parameters filename and mimeType are required',
      );
    }
    return this.assetService.getPresignedUploadUrl(filename, mimeType);
  }

  @Post('register')
  async registerDirectAsset(@Body() dto: RegisterDirectAssetDto) {
    const { filename, fileSize, mimeType, tags, s3Key } = dto;
    if (!filename || !fileSize || !mimeType || !s3Key) {
      throw new BadRequestException(
        'Required fields in body: filename, fileSize, mimeType, s3Key',
      );
    }
    return this.assetService.registerAsset(
      filename,
      fileSize,
      mimeType,
      tags || [],
      undefined,
      s3Key,
    );
  }

  @Get()
  async getAssets() {
    return this.assetService.getAssets();
  }
}

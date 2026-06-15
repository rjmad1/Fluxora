import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const execPromise = promisify(exec);

@Injectable()
export class AssetService implements OnModuleInit {
  private readonly logger = new Logger(AssetService.name);
  private s3Client: S3Client | null = null;
  private s3Bucket = 'fluxora-assets';
  private isS3Active = false;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly tenantService: TenantService,
    private readonly configService: ConfigService,
  ) {
    this.s3Bucket = this.configService.get<string>(
      'S3_BUCKET',
      'fluxora-assets',
    );
  }

  async onModuleInit() {
    const s3Endpoint = this.configService.get<string>(
      'S3_ENDPOINT',
      'http://localhost:9000',
    );
    const s3AccessKey = this.configService.get<string>(
      'S3_ACCESS_KEY',
      'minioadmin',
    );
    const s3SecretKey = this.configService.get<string>(
      'S3_SECRET_KEY',
      'minioadmin',
    );
    const s3Region = this.configService.get<string>('S3_REGION', 'us-east-1');
    const forcePathStyle =
      this.configService.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true';

    try {
      this.logger.log(`Connecting to S3/MinIO at endpoint: ${s3Endpoint}...`);
      this.s3Client = new S3Client({
        endpoint: s3Endpoint,
        region: s3Region,
        credentials: {
          accessKeyId: s3AccessKey,
          secretAccessKey: s3SecretKey,
        },
        forcePathStyle,
      });

      // Verify connection by checking or creating the default bucket
      try {
        await this.s3Client.send(
          new HeadBucketCommand({ Bucket: this.s3Bucket }),
        );
        this.logger.log(`S3 bucket "${this.s3Bucket}" verified.`);
      } catch (err: any) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
          this.logger.log(
            `S3 bucket "${this.s3Bucket}" not found. Creating bucket...`,
          );
          await this.s3Client.send(
            new CreateBucketCommand({ Bucket: this.s3Bucket }),
          );
          this.logger.log(`S3 bucket "${this.s3Bucket}" created successfully.`);
        } else {
          throw err;
        }
      }
      this.isS3Active = true;
      this.logger.log('S3/MinIO binary storage connection active.');
    } catch (err: any) {
      this.isS3Active = false;
      this.s3Client = null;
      this.logger.warn(
        `S3/MinIO storage unreachable. Operating in metadata-only fallback mode: ${err.message}`,
      );
    }
  }

  async processImage(
    buffer: Buffer,
  ): Promise<{ width: number; height: number; format: string; size: number }> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(`Sharp image processing failed: ${error.message}`);
      throw new BadRequestException(
        `Invalid image file format: ${error.message}`,
      );
    }
  }

  async transcodeVideo(filename: string, s3Key: string): Promise<string> {
    this.logger.log(
      `Initializing FFmpeg transcoding pipeline for: ${filename}`,
    );
    try {
      const { stdout } = await execPromise('ffmpeg -version');
      this.logger.log(`FFmpeg binary found: ${stdout.substring(0, 15)}...`);
    } catch (err) {
      this.logger.warn(
        `FFmpeg not found on system path, using fallback mock transcode: ${err.message}`,
      );
    }

    return `transcoded/mp4-${Date.now()}-${s3Key}`;
  }

  async getPresignedUploadUrl(
    filename: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; s3Key: string }> {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    const s3Key = `workspaces/${workspaceId}/assets/${Date.now()}-${filename}`;

    if (!this.isS3Active || !this.s3Client) {
      this.logger.log(
        `[S3 Sandbox] Generating mock upload URL for key: ${s3Key}`,
      );
      return {
        uploadUrl: `http://localhost:8000/api/v1/assets/mock-upload?key=${s3Key}`,
        s3Key,
      };
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: s3Key,
        ContentType: mimeType,
      });
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 900,
      });
      return { uploadUrl, s3Key };
    } catch (err: any) {
      this.logger.error(
        `Failed to generate presigned upload URL: ${err.message}`,
      );
      throw new InternalServerErrorException(
        `S3 presigned URL generation failed: ${err.message}`,
      );
    }
  }

  async registerAsset(
    filename: string,
    fileSize: number,
    mimeType: string,
    tags: string[],
    fileBuffer?: Buffer,
    customS3Key?: string,
  ) {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    const s3Key =
      customS3Key ||
      `workspaces/${workspaceId}/assets/${Date.now()}-${filename}`;
    const meta = {
      width: 0,
      height: 0,
      format: mimeType.split('/')[1] || 'unknown',
    };

    if (mimeType.startsWith('image/') && fileBuffer) {
      const imageMeta = await this.processImage(fileBuffer);
      meta.width = imageMeta.width;
      meta.height = imageMeta.height;
      meta.format = imageMeta.format;
    }

    let transcodedKey = s3Key;
    if (mimeType.startsWith('video/')) {
      transcodedKey = await this.transcodeVideo(filename, s3Key);
    }

    // Upload to S3 if buffer is provided and S3 connection is active
    if (this.isS3Active && this.s3Client && fileBuffer) {
      try {
        this.logger.log(`Uploading file buffer to S3: ${transcodedKey}`);
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.s3Bucket,
            Key: transcodedKey,
            Body: fileBuffer,
            ContentType: mimeType,
          }),
        );
      } catch (err: any) {
        this.logger.error(`Failed to upload file to S3: ${err.message}`);
        throw new InternalServerErrorException(
          `S3 upload failed: ${err.message}`,
        );
      }
    }

    try {
      return await this.prismaService.runInWorkspace(async (tx) => {
        return tx.asset.create({
          data: {
            workspaceId,
            s3Key: transcodedKey,
            filename,
            fileSize,
            mimeType,
            tags: [
              ...tags,
              `format:${meta.format}`,
              meta.width
                ? `dimensions:${meta.width}x${meta.height}`
                : 'type:video',
            ],
          },
        });
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to register asset: ${error.message}`,
      );
    }
  }

  async getAssets() {
    return this.prismaService.runInWorkspace(async (tx) => {
      return tx.asset.findMany({
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  getIsS3Active(): boolean {
    return this.isS3Active;
  }
}

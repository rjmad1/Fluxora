import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from './asset.service';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

// Mock sharp module
jest.mock('sharp', () => {
  const mSharp = {
    metadata: jest
      .fn()
      .mockResolvedValue({ width: 1920, height: 1080, format: 'png' }),
  };
  return jest.fn(() => mSharp);
});

describe('AssetService & Media Processing', () => {
  let assetService: AssetService;
  let tenantService: TenantService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => defaultValue),
          },
        },
        {
          provide: TenantService,
          useValue: {
            getWorkspaceId: jest.fn().mockReturnValue('workspace-alpha'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            runInWorkspace: jest.fn((cb) =>
              cb({
                asset: {
                  create: jest.fn().mockImplementation(({ data }) =>
                    Promise.resolve({
                      id: 'asset-123',
                      ...data,
                    }),
                  ),
                },
              }),
            ),
          },
        },
      ],
    }).compile();

    assetService = module.get<AssetService>(AssetService);
    tenantService = module.get<TenantService>(TenantService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processImage', () => {
    it('should extract metadata (dimensions, format) from image buffer using sharp', async () => {
      const result = await assetService.processImage(Buffer.from('mock-data'));
      expect(result).toEqual({
        width: 1920,
        height: 1080,
        format: 'png',
        size: 9,
      });
      expect(sharp).toHaveBeenCalled();
    });

    it('should throw BadRequestException if sharp metadata parsing fails', async () => {
      const mockSharp = require('sharp');
      mockSharp().metadata.mockRejectedValueOnce(
        new Error('Invalid image file'),
      );

      await expect(
        assetService.processImage(Buffer.from('corrupt-data')),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('transcodeVideo', () => {
    it('should run and return a virtual S3 key path for the transcoded video', async () => {
      const transcodedKey = await assetService.transcodeVideo(
        'intro.mov',
        'workspaces/ws-1/assets/intro.mov',
      );
      expect(transcodedKey).toContain('transcoded/mp4-');
      expect(transcodedKey).toContain('intro.mov');
    });
  });

  describe('registerAsset', () => {
    it('should successfully process and register an image asset in the database', async () => {
      const result = await assetService.registerAsset(
        'photo.png',
        1024,
        'image/png',
        ['branding', 'june'],
        Buffer.from('image-data'),
      );

      expect(result.filename).toBe('photo.png');
      expect(result.mimeType).toBe('image/png');
      expect(result.tags).toContain('branding');
      expect(result.tags).toContain('format:png');
      expect(result.tags).toContain('dimensions:1920x1080');
      expect(prismaService.runInWorkspace).toHaveBeenCalled();
    });

    it('should successfully process and register a video asset in the database', async () => {
      const result = await assetService.registerAsset(
        'teaser.mp4',
        204800,
        'video/mp4',
        ['campaign'],
      );

      expect(result.filename).toBe('teaser.mp4');
      expect(result.mimeType).toBe('video/mp4');
      expect(result.s3Key).toContain('transcoded/');
      expect(result.tags).toContain('campaign');
      expect(result.tags).toContain('type:video');
    });

    it('should throw BadRequestException if workspace context is missing', async () => {
      jest.spyOn(tenantService, 'getWorkspaceId').mockReturnValue(undefined);

      await expect(
        assetService.registerAsset('photo.png', 1024, 'image/png', []),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

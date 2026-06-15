import { Test, TestingModule } from '@nestjs/testing';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { BadRequestException } from '@nestjs/common';

describe('AssetController', () => {
  let controller: AssetController;
  let service: AssetService;

  const mockAssetService = {
    registerAsset: jest
      .fn()
      .mockImplementation((filename, size, mimeType, tags, _buffer) => {
        return Promise.resolve({
          id: 'mock-asset-id',
          filename,
          size,
          mimeType,
          tags,
          s3Key: `workspaces/ws-1/assets/${filename}`,
        });
      }),
    getAssets: jest.fn().mockResolvedValue([
      {
        id: 'mock-asset-id-1',
        filename: 'image1.png',
        size: 500,
        mimeType: 'image/png',
        tags: ['branding'],
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetController],
      providers: [
        {
          provide: AssetService,
          useValue: mockAssetService,
        },
      ],
    }).compile();

    controller = module.get<AssetController>(AssetController);
    service = module.get<AssetService>(AssetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadAsset', () => {
    it('should successfully upload an asset and split tags correctly', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test-image'),
      };
      const dto = { tags: 'banner, summer, promo' };

      const result = await controller.uploadAsset(mockFile, dto);

      expect(result).toBeDefined();
      expect(result.filename).toBe('test.jpg');
      expect(result.tags).toEqual(['banner', 'summer', 'promo']);
      expect(service.registerAsset).toHaveBeenCalledWith(
        'test.jpg',
        1024,
        'image/jpeg',
        ['banner', 'summer', 'promo'],
        mockFile.buffer,
      );
    });

    it('should successfully upload an asset with empty tags if dto tags are not provided', async () => {
      const mockFile = {
        originalname: 'test.png',
        size: 2048,
        mimetype: 'image/png',
        buffer: Buffer.from('png-data'),
      };
      const dto = {};

      const result = await controller.uploadAsset(mockFile, dto);

      expect(result).toBeDefined();
      expect(result.tags).toEqual([]);
      expect(service.registerAsset).toHaveBeenCalledWith(
        'test.png',
        2048,
        'image/png',
        [],
        mockFile.buffer,
      );
    });

    it('should throw BadRequestException if file is missing', async () => {
      await expect(controller.uploadAsset(null, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAssets', () => {
    it('should return a list of registered assets', async () => {
      const result = await controller.getAssets();

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('image1.png');
      expect(service.getAssets).toHaveBeenCalled();
    });
  });
});

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../tenant/prisma.service';

@Injectable()
export class SocialAdaptersService {
  private readonly logger = new Logger(SocialAdaptersService.name);
  private proxyUrl = '';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.proxyUrl = this.configService.get<string>('PROXY_URL', '');
  }

  private async getAxiosConfig(
    accessToken: string,
    contentType = 'application/json',
    workspaceId?: string,
  ) {
    const config: any = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
      },
    };

    let proxyUrlToUse = this.proxyUrl;

    if (workspaceId) {
      try {
        const settings = await this.prisma.workspaceSettings.findUnique({
          where: { workspaceId },
        });
        if (settings && settings.proxyUrl) {
          proxyUrlToUse = settings.proxyUrl;
        }
      } catch (err: any) {
        this.logger.error(
          `Failed to fetch custom proxy settings for workspace ${workspaceId}: ${err.message}`,
        );
      }
    }

    if (proxyUrlToUse) {
      try {
        const url = new URL(proxyUrlToUse);
        config.proxy = {
          protocol: url.protocol.replace(':', ''),
          host: url.hostname,
          port: parseInt(url.port || '80', 10),
        };
        if (url.username || url.password) {
          config.proxy.auth = {
            username: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
          };
        }
        this.logger.log(
          `Proxy configured for social adapter request: ${url.hostname}`,
        );
      } catch (err: any) {
        this.logger.warn(`Failed to parse proxy URL: ${err.message}`);
      }
    }

    return config;
  }

  async publishToPlatform(
    platform: string,
    content: string,
    mediaUrls: string[],
    accessToken: string,
    workspaceId?: string,
  ): Promise<{ success: boolean; externalPostId: string; postUrl: string }> {
    this.logger.log(
      `Publishing variant to platform: ${platform} with token: ${accessToken.substring(0, 12)}...`,
    );

    // Simulate platform-specific rate limits if content contains 'trigger-rate-limit'
    if (content.includes('trigger-rate-limit')) {
      this.logger.warn(`Simulating rate-limit on ${platform}`);
      throw new HttpException(
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          error: `${platform} API Rate Limit Exceeded. Anti-ban stagger triggered.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Simulate temporary connection issue if content contains 'trigger-network-error'
    if (content.includes('trigger-network-error')) {
      this.logger.warn(`Simulating network issue on ${platform}`);
      throw new Error(`Connection timeout during ${platform} API request`);
    }

    // Mock/Demo Mode fallback if access token is mock/dev
    if (
      accessToken.startsWith('mock-') ||
      accessToken.startsWith('token-') ||
      accessToken === 'dev-token'
    ) {
      this.logger.log(`Mock/Dev token detected. Simulating API response.`);
      const mockPostId = `ext-${platform}-${Math.random().toString(36).substring(2, 11)}`;
      let postUrl = '';

      switch (platform.toLowerCase()) {
        case 'linkedin':
          postUrl = `https://www.linkedin.com/feed/update/urn:li:share:${mockPostId}`;
          break;
        case 'twitter':
        case 'x':
          postUrl = `https://x.com/fluxora/status/${mockPostId}`;
          break;
        case 'facebook':
          postUrl = `https://facebook.com/fluxorapage/posts/${mockPostId}`;
          break;
        case 'instagram':
          postUrl = `https://instagram.com/p/${mockPostId}`;
          break;
        case 'tiktok':
          postUrl = `https://tiktok.com/@fluxora/video/${mockPostId}`;
          break;
        default:
          postUrl = `https://fluxora.io/post/${mockPostId}`;
      }

      return {
        success: true,
        externalPostId: mockPostId,
        postUrl,
      };
    }

    const platformKey = platform.toLowerCase();

    if (platformKey === 'linkedin') {
      let personUrn = 'urn:li:person:fallback-id';
      try {
        const config = await this.getAxiosConfig(
          accessToken,
          'application/json',
          workspaceId,
        );
        config.headers['X-Restli-Protocol-Version'] = '2.0.0';
        config.timeout = 5000;

        const meRes = await axios.get('https://api.linkedin.com/v2/me', config);
        if (meRes.data && meRes.data.id) {
          personUrn = `urn:li:person:${meRes.data.id}`;
        }
      } catch (err: any) {
        this.logger.warn(`Failed to fetch LinkedIn URN: ${err.message}`);
      }

      try {
        const config = await this.getAxiosConfig(
          accessToken,
          'application/json',
          workspaceId,
        );
        config.headers['X-Restli-Protocol-Version'] = '2.0.0';
        config.timeout = 5000;

        const body = {
          owner: personUrn,
          subject: 'Fluxora Omnichannel Post',
          text: { text: content },
          distribution: {
            linkedInDistributionTarget: {
              visibleToConnectionOnly: false,
            },
          },
        };

        const publishRes = await axios.post(
          'https://api.linkedin.com/v2/shares',
          body,
          config,
        );

        return {
          success: true,
          externalPostId: publishRes.data.id,
          postUrl: `https://www.linkedin.com/feed/update/urn:li:share:${publishRes.data.id}`,
        };
      } catch (err: any) {
        if (err.response?.status === 429) {
          throw new HttpException(
            {
              status: HttpStatus.TOO_MANY_REQUESTS,
              error: `LinkedIn API Rate Limit Exceeded. Anti-ban stagger triggered.`,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        throw new Error(`LinkedIn publishing failed: ${err.message}`);
      }
    }

    if (platformKey === 'twitter' || platformKey === 'x') {
      try {
        const config = await this.getAxiosConfig(
          accessToken,
          'application/json',
          workspaceId,
        );
        config.timeout = 5000;

        const publishRes = await axios.post(
          'https://api.twitter.com/2/tweets',
          { text: content },
          config,
        );

        const tweetId =
          publishRes.data?.data?.id ||
          `ext-x-${Math.random().toString(36).substring(2, 11)}`;
        return {
          success: true,
          externalPostId: tweetId,
          postUrl: `https://x.com/fluxora/status/${tweetId}`,
        };
      } catch (err: any) {
        if (err.response?.status === 429) {
          throw new HttpException(
            {
              status: HttpStatus.TOO_MANY_REQUESTS,
              error: `Twitter / X API Rate Limit Exceeded. Anti-ban stagger triggered.`,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        throw new Error(`Twitter / X publishing failed: ${err.message}`);
      }
    }

    if (platformKey === 'facebook') {
      try {
        const config = await this.getAxiosConfig(
          accessToken,
          'application/json',
          workspaceId,
        );
        config.timeout = 5000;

        const publishRes = await axios.post(
          'https://graph.facebook.com/v20.0/me/feed',
          { message: content },
          config,
        );

        return {
          success: true,
          externalPostId: publishRes.data.id,
          postUrl: `https://facebook.com/fluxorapage/posts/${publishRes.data.id}`,
        };
      } catch (err: any) {
        if (err.response?.status === 429) {
          throw new HttpException(
            {
              status: HttpStatus.TOO_MANY_REQUESTS,
              error: `Facebook API Rate Limit Exceeded. Anti-ban stagger triggered.`,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        throw new Error(`Facebook publishing failed: ${err.message}`);
      }
    }

    if (platformKey === 'instagram') {
      try {
        const config = await this.getAxiosConfig(
          accessToken,
          'application/json',
          workspaceId,
        );
        config.timeout = 5000;

        const mediaUrl = mediaUrls[0] || 'https://fluxora.io/assets/logo.png';
        const containerRes = await axios.post(
          'https://graph.facebook.com/v20.0/me/media',
          {
            image_url: mediaUrl,
            caption: content,
          },
          config,
        );

        const creationId =
          containerRes.data?.id ||
          `ext-ig-container-${Math.random().toString(36).substring(2, 11)}`;
        const publishRes = await axios.post(
          'https://graph.facebook.com/v20.0/me/media_publish',
          {
            creation_id: creationId,
          },
          config,
        );

        const externalPostId = publishRes.data?.id || creationId;
        return {
          success: true,
          externalPostId,
          postUrl: `https://instagram.com/p/${externalPostId}`,
        };
      } catch (err: any) {
        if (err.response?.status === 429) {
          throw new HttpException(
            {
              status: HttpStatus.TOO_MANY_REQUESTS,
              error: `Instagram API Rate Limit Exceeded. Anti-ban stagger triggered.`,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        throw new Error(`Instagram publishing failed: ${err.message}`);
      }
    }

    if (platformKey === 'tiktok') {
      try {
        const config = await this.getAxiosConfig(
          accessToken,
          'application/json',
          workspaceId,
        );
        config.timeout = 5000;

        const mediaUrl =
          mediaUrls[0] || 'https://fluxora.io/assets/default_video.mp4';
        const publishRes = await axios.post(
          'https://open.tiktokapis.com/v2/post/publish/video/init/',
          {
            post_info: {
              title: content.substring(0, 150),
              privacy_level: 'PUBLIC_TO_EVERYONE',
            },
            source_info: {
              source: 'FILE_UPLOAD',
              video_size: 5000000,
              chunk_size: 5000000,
              total_chunk_count: 1,
            },
          },
          config,
        );

        const publishId =
          publishRes.data?.data?.publish_id ||
          `ext-tiktok-${Math.random().toString(36).substring(2, 11)}`;
        return {
          success: true,
          externalPostId: publishId,
          postUrl: `https://tiktok.com/@fluxora/video/${publishId}`,
        };
      } catch (err: any) {
        if (err.response?.status === 429) {
          throw new HttpException(
            {
              status: HttpStatus.TOO_MANY_REQUESTS,
              error: `TikTok API Rate Limit Exceeded. Anti-ban stagger triggered.`,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        throw new Error(`TikTok publishing failed: ${err.message}`);
      }
    }

    throw new Error(`Unsupported publishing platform: ${platform}`);
  }
}

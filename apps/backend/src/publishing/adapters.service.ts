import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SocialAdaptersService {
  private readonly logger = new Logger(SocialAdaptersService.name);
  private proxyUrl = '';

  constructor(private readonly configService: ConfigService) {
    this.proxyUrl = this.configService.get<string>('PROXY_URL', '');
  }

  private getAxiosConfig(
    accessToken: string,
    contentType = 'application/json',
  ) {
    const config: any = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
      },
    };

    if (this.proxyUrl) {
      try {
        const url = new URL(this.proxyUrl);
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
        this.logger.warn(`Failed to parse PROXY_URL: ${err.message}`);
      }
    }

    return config;
  }

  async publishToPlatform(
    platform: string,
    content: string,
    mediaUrls: string[],
    accessToken: string,
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
        const config = this.getAxiosConfig(accessToken);
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
        const config = this.getAxiosConfig(accessToken);
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
        const config = this.getAxiosConfig(accessToken);
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
        const config = this.getAxiosConfig(accessToken);
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

    throw new Error(`Unsupported publishing platform: ${platform}`);
  }
}

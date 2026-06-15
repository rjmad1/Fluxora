import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class SocialAdaptersService {
  private readonly logger = new Logger(SocialAdaptersService.name);

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

    // Mock successful API response
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

    this.logger.log(
      `Post successfully published to ${platform}! URL: ${postUrl}`,
    );

    return {
      success: true,
      externalPostId: mockPostId,
      postUrl,
    };
  }
}

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
        const meRes = await fetch('https://api.linkedin.com/v2/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });
        if (meRes.ok) {
          const meData: any = await meRes.json();
          if (meData.id) {
            personUrn = `urn:li:person:${meData.id}`;
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch LinkedIn URN: ${err.message}`);
      }

      const publishRes = await fetch('https://api.linkedin.com/v2/shares', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          owner: personUrn,
          subject: 'Fluxora Omnichannel Post',
          text: { text: content },
          distribution: {
            linkedInDistributionTarget: {
              visibleToConnectionOnly: false,
            },
          },
        }),
      });

      if (publishRes.status === 429) {
        throw new HttpException(
          {
            status: HttpStatus.TOO_MANY_REQUESTS,
            error: `LinkedIn API Rate Limit Exceeded. Anti-ban stagger triggered.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (!publishRes.ok) {
        const errorText = await publishRes.text();
        throw new Error(
          `LinkedIn publishing failed: ${publishRes.status} ${errorText}`,
        );
      }

      const publishData: any = await publishRes.json();
      return {
        success: true,
        externalPostId: publishData.id,
        postUrl: `https://www.linkedin.com/feed/update/urn:li:share:${publishData.id}`,
      };
    }

    if (platformKey === 'twitter' || platformKey === 'x') {
      const publishRes = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
      });

      if (publishRes.status === 429) {
        throw new HttpException(
          {
            status: HttpStatus.TOO_MANY_REQUESTS,
            error: `Twitter / X API Rate Limit Exceeded. Anti-ban stagger triggered.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (!publishRes.ok) {
        const errorText = await publishRes.text();
        throw new Error(
          `Twitter / X publishing failed: ${publishRes.status} ${errorText}`,
        );
      }

      const publishData: any = await publishRes.json();
      const tweetId =
        publishData.data?.id ||
        `ext-x-${Math.random().toString(36).substring(2, 11)}`;
      return {
        success: true,
        externalPostId: tweetId,
        postUrl: `https://x.com/fluxora/status/${tweetId}`,
      };
    }

    if (platformKey === 'facebook') {
      const publishRes = await fetch(
        'https://graph.facebook.com/v20.0/me/feed',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: content }),
        },
      );

      if (publishRes.status === 429) {
        throw new HttpException(
          {
            status: HttpStatus.TOO_MANY_REQUESTS,
            error: `Facebook API Rate Limit Exceeded. Anti-ban stagger triggered.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (!publishRes.ok) {
        const errorText = await publishRes.text();
        throw new Error(
          `Facebook publishing failed: ${publishRes.status} ${errorText}`,
        );
      }

      const publishData: any = await publishRes.json();
      return {
        success: true,
        externalPostId: publishData.id,
        postUrl: `https://facebook.com/fluxorapage/posts/${publishData.id}`,
      };
    }

    throw new Error(`Unsupported publishing platform: ${platform}`);
  }
}

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KongService {
  private readonly logger = new Logger(KongService.name);

  /**
   * Mocks syncing an API key as a Consumer credential in Kong Gateway.
   * @param workspaceId The workspace ID
   * @param apiKey The API key
   */
  async syncConsumerKey(workspaceId: string, apiKey: string): Promise<void> {
    this.logger.log(
      `[Kong Gateway Mock] Synced new API key for workspace: ${workspaceId}. ` +
        `Traffic will now be authorized through Kong with key ending in ...${apiKey.slice(-6)}`,
    );
    // In reality, this would use the Kong Admin API:
    // await axios.post(`http://kong-admin:8001/consumers/${workspaceId}/key-auth`, { key: apiKey })
  }

  /**
   * Mocks revoking an API key from Kong Gateway.
   * @param apiKey The API key to revoke
   */
  async revokeConsumerKey(apiKey: string): Promise<void> {
    this.logger.log(
      `[Kong Gateway Mock] Revoked API key ending in ...${apiKey.slice(-6)}. ` +
        `Traffic using this key will now be rejected.`,
    );
    // In reality, this would use the Kong Admin API:
    // await axios.delete(`http://kong-admin:8001/consumers/${workspaceId}/key-auth/${keyId}`)
  }
}

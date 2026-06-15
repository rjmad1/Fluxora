import { Module } from '@nestjs/common';
import { VaultService } from './vault.service';
import { OAuthController } from './oauth.controller';

@Module({
  providers: [VaultService],
  controllers: [OAuthController],
  exports: [VaultService],
})
export class SecretsModule {}

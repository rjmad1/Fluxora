import { Module, Global } from '@nestjs/common';
import { IdentityGraphService } from './identity-graph.service';
import { IdentityController } from './identity.controller';
import { ApiKeysController } from './api-keys.controller';
import { KongService } from './kong.service';

@Global()
@Module({
  controllers: [IdentityController, ApiKeysController],
  providers: [IdentityGraphService, KongService],
  exports: [IdentityGraphService, KongService],
})
export class IdentityModule {}

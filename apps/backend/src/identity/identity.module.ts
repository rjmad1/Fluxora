import { Module, Global } from '@nestjs/common';
import { IdentityGraphService } from './identity-graph.service';
import { IdentityController } from './identity.controller';

@Global()
@Module({
  controllers: [IdentityController],
  providers: [IdentityGraphService],
  exports: [IdentityGraphService],
})
export class IdentityModule {}

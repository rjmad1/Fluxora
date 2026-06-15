import { Module, Global } from '@nestjs/common';
import { IdentityGraphService } from './identity-graph.service';

@Global()
@Module({
  providers: [IdentityGraphService],
  exports: [IdentityGraphService],
})
export class IdentityModule {}

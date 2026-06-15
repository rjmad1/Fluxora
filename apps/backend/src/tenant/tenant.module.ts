import { Module, Global } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [TenantService, PrismaService],
  exports: [TenantService, PrismaService],
})
export class TenantModule {}

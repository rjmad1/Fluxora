import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { KeycloakModule } from './identity/keycloak.module';
import { TemporalModule } from './publishing/temporal.module';
import { KafkaModule } from './observability/kafka.module';
import { TenantModule } from './tenant/tenant.module';
import { TenantInterceptor } from './tenant/tenant.filter';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KeycloakModule,
    TemporalModule,
    KafkaModule,
    TenantModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}

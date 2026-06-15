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
import { SecretsModule } from './secrets/secrets.module';
import { AssetModule } from './asset/asset.module';
import { PublishingModule } from './publishing/publishing.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AIModule } from './ai/ai.module';
import { OpenTelemetryMiddleware } from './observability/otel.middleware';
import { TransactionalOutboxInterceptor } from './observability/outbox.interceptor';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KeycloakModule,
    TemporalModule,
    KafkaModule,
    TenantModule,
    SecretsModule,
    AssetModule,
    PublishingModule,
    AnalyticsModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransactionalOutboxInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OpenTelemetryMiddleware).forRoutes('*');
  }
}

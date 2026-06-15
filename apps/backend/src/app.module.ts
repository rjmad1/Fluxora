import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { KeycloakModule } from './identity/keycloak.module';
import { BullModule } from '@nestjs/bullmq';
import { TenantModule } from './tenant/tenant.module';
import { TenantInterceptor } from './tenant/tenant.interceptor';
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
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
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

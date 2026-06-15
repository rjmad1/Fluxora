import { Controller, Post, Body, UseInterceptors, BadRequestException } from '@nestjs/common';
import { PersonalContextEngineService } from './personal-context-engine.service';
import { TenantInterceptor } from '../tenant/tenant.interceptor';

@Controller('api/v1/ai')
@UseInterceptors(TenantInterceptor)
export class AIController {
  constructor(
    private readonly contextEngine: PersonalContextEngineService,
  ) {}

  @Post('generate')
  async generatePersonalizedPost(@Body('prompt') prompt: string) {
    if (!prompt || !prompt.trim()) {
      throw new BadRequestException('Missing required field: prompt');
    }
    return this.contextEngine.generateContent(prompt);
  }
}

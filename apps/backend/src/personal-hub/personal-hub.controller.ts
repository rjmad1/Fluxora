import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { PersonalProfileService } from './personal-profile.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { DigitalTwinService } from './digital-twin.service';
import { IngestionService } from './ingestion.service';
import { TenantInterceptor } from '../tenant/tenant.interceptor';

@Controller('api/personal-hub')
@UseInterceptors(TenantInterceptor)
export class PersonalHubController {
  constructor(
    private readonly profileService: PersonalProfileService,
    private readonly graphService: KnowledgeGraphService,
    private readonly digitalTwinService: DigitalTwinService,
    private readonly ingestionService: IngestionService,
  ) {}

  @Get('profile')
  async getProfile() {
    return this.profileService.getOrCreateProfile();
  }

  @Put('profile')
  async updateProfile(@Body() body: any) {
    return this.profileService.updateProfile(body);
  }

  @Get('content-dna')
  async getContentDNA() {
    return this.profileService.getContentDNA();
  }

  @Put('content-dna')
  async updateContentDNA(@Body() body: any) {
    return this.profileService.updateContentDNA(body);
  }

  @Get('goals')
  async getGoals() {
    return this.profileService.getGoals();
  }

  @Post('goals')
  async addGoal(@Body() body: any) {
    return this.profileService.addGoal(body);
  }

  @Put('goals/:id')
  async updateGoal(@Param('id') id: string, @Body() body: any) {
    return this.profileService.updateGoal(id, body);
  }

  @Get('expertise')
  async getExpertise() {
    return this.profileService.getExpertise();
  }

  @Post('expertise')
  async addExpertise(@Body() body: any) {
    return this.profileService.addExpertise(body);
  }

  @Get('digital-twin')
  async getDigitalTwin() {
    return this.digitalTwinService.getOrCreateDigitalTwin();
  }

  @Put('digital-twin')
  async updateDigitalTwin(@Body() body: any) {
    return this.digitalTwinService.updateDigitalTwin(body);
  }

  @Get('voice-profile')
  async getVoiceProfile() {
    return this.digitalTwinService.getOrCreateVoiceProfile();
  }

  @Put('voice-profile')
  async updateVoiceProfile(@Body() body: any) {
    return this.digitalTwinService.updateVoiceProfile(body);
  }

  @Get('knowledge-graph')
  async getKnowledgeGraph() {
    return this.graphService.getNodesAndEdges();
  }

  @Post('ingest/linkedin')
  async ingestLinkedIn(@Body('url') url: string) {
    return this.ingestionService.ingestLinkedIn(url);
  }

  @Post('ingest/resume')
  async ingestResume(@Body('resumeText') resumeText: string) {
    return this.ingestionService.ingestResume(resumeText);
  }

  @Post('ingest/website')
  async ingestWebsite(@Body('url') url: string) {
    return this.ingestionService.ingestWebsite(url);
  }
}

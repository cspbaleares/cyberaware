import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PhishingSimulationsService } from './phishing-simulations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { TenantRolesGuard } from '../auth/guards/tenant-roles.guard';
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';
import { CreatePhishingSimulationDto } from './dto/create-phishing-simulation.dto';
import { UpdatePhishingSimulationDto } from './dto/update-phishing-simulation.dto';
import { AssignPhishingRecipientsDto } from './dto/assign-phishing-recipients.dto';
import { UpdatePhishingRecipientStatusDto } from './dto/update-phishing-recipient-status.dto';

@Controller('phishing-simulations')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  TenantRolesGuard,
)
export class PhishingSimulationsController {
  constructor(private readonly phishingSimulationsService: PhishingSimulationsService) {}

  @Get()
  @TenantAdminOnly()
  async list(@Req() req: any, @Query() query: any) {
    return this.phishingSimulationsService.listSimulations(req.user.tenantId, query);
  }

  @Get('metrics/summary')
  @TenantAdminOnly()
  async summary(@Req() req: any) {
    return this.phishingSimulationsService.getSummary(req.user.tenantId);
  }

  @Get(':id')
  @TenantAdminOnly()
  async getById(@Req() req: any, @Param('id') id: string) {
    return this.phishingSimulationsService.getSimulation(req.user.tenantId, id);
  }

  @Post()
  @TenantAdminOnly()
  async create(@Req() req: any, @Body() dto: CreatePhishingSimulationDto) {
    return this.phishingSimulationsService.createSimulation(req.user.tenantId, req.user, dto);
  }

  @Patch(':id')
  @TenantAdminOnly()
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePhishingSimulationDto) {
    return this.phishingSimulationsService.updateSimulation(req.user.tenantId, id, req.user, dto);
  }

  @Patch(':id/archive')
  @TenantAdminOnly()
  async archive(@Req() req: any, @Param('id') id: string) {
    return this.phishingSimulationsService.archiveSimulation(req.user.tenantId, id, req.user);
  }

  @Post(':simulationId/recipients')
  @TenantAdminOnly()
  async assignRecipients(
    @Req() req: any,
    @Param('simulationId') simulationId: string,
    @Body() dto: AssignPhishingRecipientsDto,
  ) {
    return this.phishingSimulationsService.assignRecipients(
      req.user.tenantId,
      simulationId,
      req.user,
      dto,
    );
  }

  @Get(':simulationId/recipients')
  @TenantAdminOnly()
  async listRecipients(@Req() req: any, @Param('simulationId') simulationId: string) {
    return this.phishingSimulationsService.listRecipients(req.user.tenantId, simulationId);
  }

  @Get(':simulationId/recipients/metrics')
  @TenantAdminOnly()
  async recipientMetrics(@Req() req: any, @Param('simulationId') simulationId: string) {
    return this.phishingSimulationsService.getRecipientMetrics(req.user.tenantId, simulationId);
  }

  @Patch('recipients/:recipientId/status')
  @TenantAdminOnly()
  async updateRecipientStatus(
    @Req() req: any,
    @Param('recipientId') recipientId: string,
    @Body() dto: UpdatePhishingRecipientStatusDto,
  ) {
    return this.phishingSimulationsService.updateRecipientStatus(
      req.user.tenantId,
      recipientId,
      req.user,
      dto,
    );
  }

  @Patch('recipients/:recipientId/unassign')
  @TenantAdminOnly()
  async unassignRecipient(@Req() req: any, @Param('recipientId') recipientId: string) {
    return this.phishingSimulationsService.unassignRecipient(req.user.tenantId, recipientId, req.user);
  }
}

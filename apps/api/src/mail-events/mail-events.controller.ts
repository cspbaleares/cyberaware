import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { MailEventsService } from './mail-events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { TenantRolesGuard } from '../auth/guards/tenant-roles.guard';
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';
import { CreateOutboundMailEventDto } from './dto/create-outbound-mail-event.dto';
import { ProviderWebhookDto } from './dto/provider-webhook.dto';

@Controller('mail-events')
export class MailEventsController {
  constructor(private readonly mailEventsService: MailEventsService) {}

  @Post('provider-webhook')
  async providerWebhook(@Body() dto: ProviderWebhookDto | Record<string, any>) {
    return this.mailEventsService.providerWebhook(dto);
  }

  @Get('simulations/:simulationId')
  @UseGuards(
    JwtAuthGuard,
    PasswordChangeRequiredGuard,
    MfaEnforcedGuard,
    TenantRolesGuard,
  )
  @TenantAdminOnly()
  async listSimulationEvents(@Req() req: any, @Param('simulationId') simulationId: string) {
    return this.mailEventsService.listSimulationEvents(req.user.tenantId, simulationId);
  }

  @Get('simulations/:simulationId/summary')
  @UseGuards(
    JwtAuthGuard,
    PasswordChangeRequiredGuard,
    MfaEnforcedGuard,
    TenantRolesGuard,
  )
  @TenantAdminOnly()
  async summary(@Req() req: any, @Param('simulationId') simulationId: string) {
    return this.mailEventsService.summary(req.user.tenantId, simulationId);
  }

  @Post('simulations/:simulationId')
  @UseGuards(
    JwtAuthGuard,
    PasswordChangeRequiredGuard,
    MfaEnforcedGuard,
    TenantRolesGuard,
  )
  @TenantAdminOnly()
  async createManualEvent(
    @Req() req: any,
    @Param('simulationId') simulationId: string,
    @Body() dto: CreateOutboundMailEventDto,
  ) {
    return this.mailEventsService.createManualEvent(req.user.tenantId, simulationId, req.user, dto);
  }
}

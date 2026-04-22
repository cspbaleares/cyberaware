import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { TenantRolesGuard } from '../auth/guards/tenant-roles.guard';
import { AutomationRulesService } from './automation-rules.service';

@Controller('automation-rules')
@UseGuards(JwtAuthGuard, PasswordChangeRequiredGuard, MfaEnforcedGuard, TenantRolesGuard)
@TenantAdminOnly()
export class AutomationRulesController {
  constructor(private readonly service: AutomationRulesService) {}

  @Get()
  async list(@Req() req: Request, @Query('status') status?: string) {
    return this.service.listRules(req.user, status, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('metrics/summary')
  async metrics(@Req() req: Request) {
    return this.service.getMetrics(req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req: Request) {
    return this.service.getRule(req.user, id, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('seed-defaults')
  async seedDefaults(@Req() req: Request) {
    return this.service.seedDefaults(req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch(':id/toggle')
  async toggle(@Param('id') id: string, @Body() body: { isEnabled?: boolean }, @Req() req: Request) {
    return this.service.toggleRule(req.user, id, body?.isEnabled, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { priority?: string; targetModuleKey?: string | null; cooldownMinutes?: number; isEnabled?: boolean },
    @Req() req: Request,
  ) {
    return this.service.updateRule(req.user, id, body, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}

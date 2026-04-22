import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlatformAdminOnly } from '../auth/decorators/platform-admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { UpdateTenantModuleDto } from './dto/update-tenant-module.dto';
import { PlatformService } from './platform.service';

@Controller('platform')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  PlatformAdminGuard,
)
@PlatformAdminOnly()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  private getMeta(req: Request) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.ip;

    const userAgent = req.headers['user-agent'];

    return {
      ipAddress: ipAddress ?? undefined,
      userAgent: typeof userAgent === 'string' ? userAgent : undefined,
    };
  }

  @Get('tenants')
  async getTenants() {
    return this.platformService.listTenants();
  }

  @Get('tenants/:tenantId/modules')
  async getTenantModules(@Param('tenantId') tenantId: string) {
    return this.platformService.getTenantModules(tenantId);
  }

  @Put('tenants/:tenantId/modules/:moduleKey')
  async updateTenantModule(
    @Param('tenantId') tenantId: string,
    @Param('moduleKey') moduleKey: string,
    @Body() dto: UpdateTenantModuleDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.platformService.updateTenantModule(
      tenantId,
      moduleKey,
      dto.isEnabled,
      user,
      this.getMeta(req),
    );
  }
}

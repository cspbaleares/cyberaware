import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SuperAdminOnly } from '../auth/decorators/super-admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  SuperAdminGuard,
)
@SuperAdminOnly()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async listTenants() {
    return this.tenantsService.listTenants();
  }

  @Get(':id')
  async getTenant(@Param('id') id: string) {
    return this.tenantsService.getTenantById(id);
  }

  @Post()
  async createTenant(@Body() dto: CreateTenantDto, @Req() req: Request) {
    return this.tenantsService.createTenant(dto, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch(':id/disable')
  async disableTenant(@Param('id') id: string, @Req() req: Request) {
    return this.tenantsService.disableTenant(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch(':id/enable')
  async enableTenant(@Param('id') id: string, @Req() req: Request) {
    return this.tenantsService.enableTenant(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}

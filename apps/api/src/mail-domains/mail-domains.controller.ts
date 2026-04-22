import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { MailDomainsService } from './mail-domains.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { TenantRolesGuard } from '../auth/guards/tenant-roles.guard';
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';
import { CreateMailDomainDto } from './dto/create-mail-domain.dto';
import { UpdateMailDomainDto } from './dto/update-mail-domain.dto';

@Controller('mail-domains')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  TenantRolesGuard,
)
export class MailDomainsController {
  constructor(private readonly mailDomainsService: MailDomainsService) {}

  @Get()
  @TenantAdminOnly()
  async list(@Req() req: any, @Query() query: any) {
    return this.mailDomainsService.list(req.user.tenantId, query);
  }

  @Get('metrics/summary')
  @TenantAdminOnly()
  async summary(@Req() req: any) {
    return this.mailDomainsService.summary(req.user.tenantId);
  }

  @Get(':id')
  @TenantAdminOnly()
  async getById(@Req() req: any, @Param('id') id: string) {
    return this.mailDomainsService.getById(req.user.tenantId, id);
  }

  @Post()
  @TenantAdminOnly()
  async create(@Req() req: any, @Body() dto: CreateMailDomainDto) {
    return this.mailDomainsService.create(req.user.tenantId, req.user, dto);
  }

  @Patch(':id')
  @TenantAdminOnly()
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateMailDomainDto) {
    return this.mailDomainsService.update(req.user.tenantId, id, req.user, dto);
  }

  @Patch(':id/verify')
  @TenantAdminOnly()
  async verify(@Req() req: any, @Param('id') id: string) {
    return this.mailDomainsService.verify(req.user.tenantId, id, req.user);
  }

  @Patch(':id/disable')
  @TenantAdminOnly()
  async disable(@Req() req: any, @Param('id') id: string) {
    return this.mailDomainsService.disable(req.user.tenantId, id, req.user);
  }

  @Patch(':id/archive')
  @TenantAdminOnly()
  async archive(@Req() req: any, @Param('id') id: string) {
    return this.mailDomainsService.archive(req.user.tenantId, id, req.user);
  }
}

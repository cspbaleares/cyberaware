import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PhishingTemplatesService } from './phishing-templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { TenantRolesGuard } from '../auth/guards/tenant-roles.guard';
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';
import { CreatePhishingTemplateDto } from './dto/create-phishing-template.dto';
import { UpdatePhishingTemplateDto } from './dto/update-phishing-template.dto';

@Controller('phishing-templates')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  TenantRolesGuard,
)
export class PhishingTemplatesController {
  constructor(private readonly phishingTemplatesService: PhishingTemplatesService) {}

  @Get()
  @TenantAdminOnly()
  async list(@Req() req: any, @Query() query: any) {
    return this.phishingTemplatesService.listTemplates(req.user.tenantId, query);
  }

  @Get('metrics/summary')
  @TenantAdminOnly()
  async summary(@Req() req: any) {
    return this.phishingTemplatesService.summary(req.user.tenantId);
  }

  @Get(':id')
  @TenantAdminOnly()
  async getById(@Req() req: any, @Param('id') id: string) {
    return this.phishingTemplatesService.getTemplate(req.user.tenantId, id);
  }

  @Post()
  @TenantAdminOnly()
  async create(@Req() req: any, @Body() dto: CreatePhishingTemplateDto) {
    return this.phishingTemplatesService.createTemplate(req.user.tenantId, req.user, dto);
  }

  @Patch(':id')
  @TenantAdminOnly()
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePhishingTemplateDto) {
    return this.phishingTemplatesService.updateTemplate(req.user.tenantId, id, req.user, dto);
  }

  @Patch(':id/archive')
  @TenantAdminOnly()
  async archive(@Req() req: any, @Param('id') id: string) {
    return this.phishingTemplatesService.archiveTemplate(req.user.tenantId, id, req.user);
  }
}

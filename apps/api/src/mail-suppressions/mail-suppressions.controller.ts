import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { MailSuppressionsService } from './mail-suppressions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { TenantRolesGuard } from '../auth/guards/tenant-roles.guard';
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';
import { CreateMailSuppressionDto } from './dto/create-mail-suppression.dto';

@Controller('mail-suppressions')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  TenantRolesGuard,
)
export class MailSuppressionsController {
  constructor(private readonly mailSuppressionsService: MailSuppressionsService) {}

  @Get()
  @TenantAdminOnly()
  async list(@Req() req: any, @Query() query: any) {
    return this.mailSuppressionsService.list(req.user.tenantId, query);
  }

  @Get('metrics/summary')
  @TenantAdminOnly()
  async summary(@Req() req: any) {
    return this.mailSuppressionsService.summary(req.user.tenantId);
  }

  @Post()
  @TenantAdminOnly()
  async create(@Req() req: any, @Body() dto: CreateMailSuppressionDto) {
    return this.mailSuppressionsService.create(req.user.tenantId, req.user, dto);
  }

  @Delete(':id')
  @TenantAdminOnly()
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.mailSuppressionsService.remove(req.user.tenantId, id, req.user);
  }
}

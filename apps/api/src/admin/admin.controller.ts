import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SuperAdminOnly } from '../auth/decorators/super-admin-only.decorator';
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@Controller('admin')
export class AdminController {
  @Get('profile')
  @UseGuards(
    JwtAuthGuard,
    PasswordChangeRequiredGuard,
    MfaEnforcedGuard,
  )
  @TenantAdminOnly()
  getProfile(@CurrentUser() user: any) {
    return {
      ok: true,
      scope: 'tenant',
      user,
    };
  }

  @Get('platform')
  @UseGuards(
    JwtAuthGuard,
    PasswordChangeRequiredGuard,
    MfaEnforcedGuard,
    SuperAdminGuard,
  )
  @SuperAdminOnly()
  getPlatform(@CurrentUser() user: any) {
    return {
      ok: true,
      scope: 'platform',
      user,
    };
  }
}

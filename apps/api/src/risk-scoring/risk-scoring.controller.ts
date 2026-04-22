import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RiskScoringService } from './risk-scoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { TenantRolesGuard } from '../auth/guards/tenant-roles.guard';
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';

@Controller('risk-scoring')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  TenantRolesGuard,
)
export class RiskScoringController {
  constructor(private readonly riskScoringService: RiskScoringService) {}

  @Post('tenant/recalculate')
  @TenantAdminOnly()
  async recalculateTenant(@Req() req: any) {
    return this.riskScoringService.recalculateTenantRisk(
      req.user.tenantId,
      req.user.sub ?? req.user.id,
    );
  }

  @Post('users/:userId/recalculate')
  @TenantAdminOnly()
  async recalculateUser(@Req() req: any, @Param('userId') userId: string) {
    return this.riskScoringService.recalculateUserRisk(
      req.user.tenantId,
      userId,
      req.user.sub ?? req.user.id,
    );
  }

  @Get('tenant')
  @TenantAdminOnly()
  async listTenantScores(@Req() req: any) {
    return this.riskScoringService.listTenantRiskScores(req.user.tenantId);
  }

  @Get('tenant/summary')
  @TenantAdminOnly()
  async getTenantSummary(@Req() req: any) {
    return this.riskScoringService.getTenantRiskSummary(
      req.user.tenantId,
      req.user.sub ?? req.user.id,
    );
  }
}

import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SimulationDispatchService } from './simulation-dispatch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { TenantRolesGuard } from '../auth/guards/tenant-roles.guard';
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';
import { DispatchSimulationDto } from './dto/dispatch-simulation.dto';

@Controller('simulation-dispatch')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  TenantRolesGuard,
)
export class SimulationDispatchController {
  constructor(private readonly simulationDispatchService: SimulationDispatchService) {}

  @Post(':simulationId')
  @TenantAdminOnly()
  async dispatch(
    @Req() req: any,
    @Param('simulationId') simulationId: string,
    @Body() dto: DispatchSimulationDto,
  ) {
    return this.simulationDispatchService.dispatchSimulation(
      req.user.tenantId,
      simulationId,
      req.user,
      dto,
    );
  }
}

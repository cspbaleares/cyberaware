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
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { TenantRolesGuard } from '../auth/guards/tenant-roles.guard';
import { CampaignAssignmentsService } from './campaign-assignments.service';
import { AssignCampaignDto } from './dto/assign-campaign.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';

@Controller('campaigns')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  TenantRolesGuard,
)
@TenantAdminOnly()
export class CampaignAssignmentsController {
  constructor(private readonly service: CampaignAssignmentsService) {}

  @Post(':campaignId/assignments')
  async assignUsers(
    @Param('campaignId') campaignId: string,
    @Body() dto: AssignCampaignDto,
    @Req() req: Request,
  ) {
    return this.service.assignUsers(req.user, campaignId, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get(':campaignId/assignments')
  async listAssignments(@Param('campaignId') campaignId: string, @Req() req: Request) {
    return this.service.listAssignments(req.user, campaignId, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get(':campaignId/assignments/metrics')
  async getMetrics(@Param('campaignId') campaignId: string, @Req() req: Request) {
    return this.service.getAssignmentMetrics(req.user, campaignId, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch('assignments/:assignmentId/status')
  async updateStatus(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateAssignmentStatusDto,
    @Req() req: Request,
  ) {
    return this.service.updateAssignmentStatus(req.user, assignmentId, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch('assignments/:assignmentId/unassign')
  async unassign(@Param('assignmentId') assignmentId: string, @Req() req: Request) {
    return this.service.unassign(req.user, assignmentId, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}

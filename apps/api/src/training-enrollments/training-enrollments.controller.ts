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
import { TrainingEnrollmentsService } from './training-enrollments.service';
import { AssignTrainingDto } from './dto/assign-training.dto';
import { UpdateTrainingEnrollmentStatusDto } from './dto/update-training-enrollment-status.dto';

@Controller('training-catalog')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  TenantRolesGuard,
)
@TenantAdminOnly()
export class TrainingEnrollmentsController {
  constructor(private readonly service: TrainingEnrollmentsService) {}

  @Post(':trainingId/enrollments')
  async assignUsers(
    @Param('trainingId') trainingId: string,
    @Body() dto: AssignTrainingDto,
    @Req() req: Request,
  ) {
    return this.service.assignUsers(req.user, trainingId, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get(':trainingId/enrollments')
  async listEnrollments(@Param('trainingId') trainingId: string, @Req() req: Request) {
    return this.service.listEnrollments(req.user, trainingId, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get(':trainingId/enrollments/metrics')
  async getMetrics(@Param('trainingId') trainingId: string, @Req() req: Request) {
    return this.service.getEnrollmentMetrics(req.user, trainingId, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch('enrollments/:enrollmentId/status')
  async updateStatus(
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: UpdateTrainingEnrollmentStatusDto,
    @Req() req: Request,
  ) {
    return this.service.updateEnrollmentStatus(req.user, enrollmentId, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch('enrollments/:enrollmentId/unenroll')
  async unenroll(@Param('enrollmentId') enrollmentId: string, @Req() req: Request) {
    return this.service.unenroll(req.user, enrollmentId, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { TenantRolesGuard } from '../auth/guards/tenant-roles.guard';
import { TrainingCatalogService } from './training-catalog.service';
import { CreateTrainingCourseDto } from './dto/create-training-course.dto';
import { UpdateTrainingCourseDto } from './dto/update-training-course.dto';
import { ListTrainingCoursesDto } from './dto/list-training-courses.dto';

@Controller('training-catalog')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  TenantRolesGuard,
)
@TenantAdminOnly()
export class TrainingCatalogController {
  constructor(private readonly service: TrainingCatalogService) {}

  @Get()
  async listCourses(@Query() query: ListTrainingCoursesDto, @Req() req: Request) {
    return this.service.listCourses(req.user, query, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('metrics/summary')
  async getMetrics(@Req() req: Request) {
    return this.service.getMetrics(req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get(':id')
  async getCourse(@Param('id') id: string, @Req() req: Request) {
    return this.service.getCourseById(req.user, id, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post()
  async createCourse(@Body() dto: CreateTrainingCourseDto, @Req() req: Request) {
    return this.service.createCourse(req.user, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch(':id')
  async updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingCourseDto,
    @Req() req: Request,
  ) {
    return this.service.updateCourse(req.user, id, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch(':id/archive')
  async archiveCourse(@Param('id') id: string, @Req() req: Request) {
    return this.service.archiveCourse(req.user, id, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}

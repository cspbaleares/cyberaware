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
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ListCampaignsDto } from './dto/list-campaigns.dto';

@Controller('campaigns')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
  TenantRolesGuard,
)
@TenantAdminOnly()
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  async listCampaigns(@Query() query: ListCampaignsDto, @Req() req: Request) {
    return this.campaignsService.listCampaigns(req.user, query, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('metrics/summary')
  async getMetrics(@Req() req: Request) {
    return this.campaignsService.getCampaignMetrics(req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get(':id')
  async getCampaign(@Param('id') id: string, @Req() req: Request) {
    return this.campaignsService.getCampaignById(req.user, id, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post()
  async createCampaign(@Body() dto: CreateCampaignDto, @Req() req: Request) {
    return this.campaignsService.createCampaign(req.user, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch(':id')
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @Req() req: Request,
  ) {
    return this.campaignsService.updateCampaign(req.user, id, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch(':id/archive')
  async archiveCampaign(@Param('id') id: string, @Req() req: Request) {
    return this.campaignsService.archiveCampaign(req.user, id, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}

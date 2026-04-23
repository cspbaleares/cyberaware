import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async create(
    @Body() data: { email: string; tenantId: string; role?: string },
    @CurrentUser() user: any,
  ) {
    return this.invitationsService.create(data, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async findAll() {
    return this.invitationsService.findAll();
  }

  @Get('verify')
  async verify(@Query('token') token: string) {
    return this.invitationsService.verify(token);
  }

  @Post('accept')
  async accept(
    @Body() data: { token: string; firstName: string; lastName: string; password: string },
  ) {
    return this.invitationsService.accept(data);
  }
}

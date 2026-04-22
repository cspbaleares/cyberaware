import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantAdminOnly } from '../auth/decorators/tenant-admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MfaEnforcedGuard } from '../auth/guards/mfa-enforced.guard';
import { PasswordChangeRequiredGuard } from '../auth/guards/password-change-required.guard';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(
  JwtAuthGuard,
  PasswordChangeRequiredGuard,
  MfaEnforcedGuard,
)
@TenantAdminOnly()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async listUsers(
    @CurrentUser() currentUser: any,
    @Query() query: ListUsersDto,
  ) {
    return this.usersService.listUsers(currentUser, query);
  }

  @Get(':id')
  async getUser(
    @CurrentUser() currentUser: any,
    @Param('id') id: string,
  ) {
    return this.usersService.getUserById(currentUser, id);
  }

  @Post()
  async createUser(
    @CurrentUser() currentUser: any,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.createUser(currentUser, dto);
  }

  @Patch(':id/disable')
  async disableUser(
    @CurrentUser() currentUser: any,
    @Param('id') id: string,
  ) {
    return this.usersService.disableUser(currentUser, id);
  }

  @Patch(':id/enable')
  async enableUser(
    @CurrentUser() currentUser: any,
    @Param('id') id: string,
  ) {
    return this.usersService.enableUser(currentUser, id);
  }

  @Post(':id/roles')
  async assignRoles(
    @CurrentUser() currentUser: any,
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(currentUser, id, dto);
  }

  @Post(':id/admin-reset-password')
  async adminResetPassword(
    @CurrentUser() currentUser: any,
    @Param('id') id: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.usersService.adminResetPassword(currentUser, id, dto);
  }

  @Post(':id/admin-reset-mfa')
  async adminResetMfa(
    @CurrentUser() currentUser: any,
    @Param('id') id: string,
  ) {
    return this.usersService.adminResetMfa(currentUser, id);
  }
}

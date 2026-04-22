import { applyDecorators, UseGuards } from '@nestjs/common';
import { TenantRoleOnly } from './tenant-role-only.decorator';
import { TenantRolesGuard } from '../guards/tenant-roles.guard';

export function AdminOnly(...roles: string[]) {
  return applyDecorators(
    TenantRoleOnly(...roles),
    UseGuards(TenantRolesGuard),
  );
}

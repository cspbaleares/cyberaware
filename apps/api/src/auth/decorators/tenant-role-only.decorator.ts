import { SetMetadata } from '@nestjs/common';

export const TENANT_ROLE_ONLY_KEY = 'tenant_role_only';

export const TenantRoleOnly = (...roles: string[]) =>
  SetMetadata(TENANT_ROLE_ONLY_KEY, roles);

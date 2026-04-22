import { TenantRoleOnly } from './tenant-role-only.decorator';

export const TenantAdminOnly = () => TenantRoleOnly('tenant_admin');

import { SetMetadata } from '@nestjs/common';

export const SUPER_ADMIN_ONLY_KEY = 'super_admin_only';

export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_ONLY_KEY, true);

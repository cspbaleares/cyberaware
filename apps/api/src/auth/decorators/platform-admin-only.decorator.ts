import { SetMetadata } from '@nestjs/common';

export const PLATFORM_ADMIN_ONLY_KEY = 'platform_admin_only';

export const PlatformAdminOnly = () => SetMetadata(PLATFORM_ADMIN_ONLY_KEY, true);

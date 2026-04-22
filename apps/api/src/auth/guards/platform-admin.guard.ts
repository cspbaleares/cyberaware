import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLATFORM_ADMIN_ONLY_KEY } from '../decorators/platform-admin-only.decorator';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresPlatformAdmin = this.reflector.getAllAndOverride<boolean>(
      PLATFORM_ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresPlatformAdmin) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const roles = Array.isArray(user.roles) ? user.roles : [];
    const allowed = user.isSuperAdmin === true || roles.includes('platform_admin');

    if (!allowed) {
      throw new ForbiddenException('Platform admin access required');
    }

    return true;
  }
}

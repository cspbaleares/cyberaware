import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TENANT_ROLE_ONLY_KEY } from '../decorators/tenant-role-only.decorator';

@Injectable()
export class TenantRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(TENANT_ROLE_ONLY_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const roles = Array.isArray(user.roles) ? user.roles : [];
    const allowed = requiredRoles.some((role) => roles.includes(role));

    if (!allowed) {
      throw new ForbiddenException('No tienes permisos suficientes');
    }

    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class PasswordChangeRequiredGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (user.mustChangePassword) {
      throw new ForbiddenException('Debes cambiar la contraseña antes de continuar');
    }

    if (user.passwordExpired) {
      throw new ForbiddenException('La contraseña ha expirado y debe ser cambiada');
    }

    return true;
  }
}

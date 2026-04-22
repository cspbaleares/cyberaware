import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class MfaEnforcedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (user.mfaPending === true) {
      throw new ForbiddenException('MFA obligatorio para este recurso');
    }

    if (user.mfaVerified === false) {
      throw new ForbiddenException('MFA obligatorio para este recurso');
    }

    return true;
  }
}

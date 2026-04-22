import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JwtPayload = {
  sub: string;
  tenantId: string;
  tenantSlug: string;
  email: string;
  isSuperAdmin: boolean;
  roles: string[];
  mfaEnabled: boolean;
  mustChangePassword: boolean;
  passwordExpired: boolean;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Missing JWT_SECRET');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      sub: payload.sub,
      tenantId: payload.tenantId,
      tenantSlug: payload.tenantSlug,
      email: payload.email,
      isSuperAdmin: payload.isSuperAdmin,
      roles: Array.isArray(payload.roles) ? payload.roles : [],
      mfaEnabled: payload.mfaEnabled,
      mustChangePassword: payload.mustChangePassword,
      passwordExpired: payload.passwordExpired,
    };
  }
}

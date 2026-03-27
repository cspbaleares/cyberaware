import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        slug: dto.tenantSlug,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: dto.email,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      await this.prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: 'auth.login.failed',
          entityType: 'user',
          severity: 'warning',
          status: 'failed',
          source: 'api',
          ipAddress,
          userAgent,
          metadata: {
            reason: 'user_not_found',
            email: dto.email,
          },
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: 'auth.login.blocked',
          entityType: 'user',
          entityId: user.id,
          severity: 'warning',
          status: 'failed',
          source: 'api',
          ipAddress,
          userAgent,
          metadata: {
            reason: 'account_locked',
          },
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordOk) {
      const failedCount = user.failedLoginCount + 1;
      const lockUser = failedCount >= 5;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failedCount,
          lockedUntil: lockUser ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: 'auth.login.failed',
          entityType: 'user',
          entityId: user.id,
          severity: 'warning',
          status: 'failed',
          source: 'api',
          ipAddress,
          userAgent,
          metadata: {
            reason: 'bad_password',
            failedLoginCount: failedCount,
          },
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const payload = {
      sub: user.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      mfaEnabled: user.mfaEnabled,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    await this.prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: 'auth.login.success',
        entityType: 'user',
        entityId: user.id,
        severity: 'info',
        status: 'success',
        source: 'api',
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        isSuperAdmin: user.isSuperAdmin,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }
}

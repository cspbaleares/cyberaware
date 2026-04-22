import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
const speakeasy = require('speakeasy');
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const PASSWORD_MAX_AGE_DAYS = 90;

@Injectable()
export class AuthService {
  private getCurrentUserId(currentUser: any): string | null {
    if (!currentUser) {
      return null;
    }

    if (typeof currentUser === 'string') {
      return currentUser;
    }

    if (typeof currentUser?.sub === 'string') {
      return currentUser.sub;
    }

    if (typeof currentUser?.id === 'string') {
      return currentUser.id;
    }

    return null;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private isPasswordExpired(passwordChangedAt: Date | string | null | undefined): boolean {
    if (!passwordChangedAt) {
      return true;
    }

    const changedAt = new Date(passwordChangedAt);
    const expiresAt = new Date(changedAt);
    expiresAt.setDate(expiresAt.getDate() + PASSWORD_MAX_AGE_DAYS);

    return expiresAt.getTime() <= Date.now();
  }

  private async writeAudit(data: {
    tenantId: string;
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    severity: string;
    status: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    await this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        severity: data.severity,
        status: data.status,
        source: 'api',
        requestId: null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        metadata: (data.metadata ?? {}) as any,
      },
    });
  }

  async login(dto: LoginDto, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        slug: dto.tenantSlug,
        deletedAt: null,
      },
    });

    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: dto.email.trim().toLowerCase(),
        deletedAt: null,
      },
      include: {
        memberships: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      throw new UnauthorizedException('Cuenta temporalmente bloqueada');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);

    if (!valid) {
      const failedLoginCount = user.failedLoginCount + 1;
      const lockedUntil = failedLoginCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount,
          lockedUntil,
        },
      });

      await this.writeAudit({
        tenantId: tenant.id,
        userId: user.id,
        action: 'auth.login',
        entityType: 'User',
        entityId: user.id,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          reason: 'invalid_password',
          failedLoginCount,
          lockedUntil,
        },
      });

      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const roles = user.memberships.map((m) => m.role.name);
    const passwordExpired = this.isPasswordExpired(user.passwordChangedAt);

    if (user.mfaEnabled) {
      const mfaToken = await this.jwtService.signAsync({
        sub: user.id,
        id: user.id,
        tenantId: user.tenantId,
        tenantSlug: tenant.slug,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        roles,
        mfaPending: true,
        mfaVerified: false,
        mustChangePassword: user.mustChangePassword,
        passwordExpired,
      });

      await this.writeAudit({
        tenantId: tenant.id,
        userId: user.id,
        action: 'auth.login',
        entityType: 'User',
        entityId: user.id,
        severity: 'INFO',
        status: 'SUCCESS',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          mfaRequired: true,
          passwordExpired,
        },
      });

      return {
        mfaRequired: true,
        mfaToken,
        mustChangePassword: user.mustChangePassword,
        passwordExpired,
      };
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      id: user.id,
      tenantId: user.tenantId,
      tenantSlug: tenant.slug,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      roles,
      mfaVerified: true,
      mustChangePassword: user.mustChangePassword,
      passwordExpired,
    });

    await this.writeAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'auth.login',
      entityType: 'User',
      entityId: user.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        mfaRequired: false,
        passwordExpired,
      },
    });

    return {
      accessToken,
      mustChangePassword: user.mustChangePassword,
      passwordExpired,
    };
  }

  async me(currentUser: any) {
    const userId = this.getCurrentUserId(currentUser);

    const user = await this.prisma.user.findUnique({
      where: { id: userId ?? undefined },
      include: {
        memberships: {
          include: {
            role: true,
          },
        },
        tenant: true,
      },
    });

    if (!user || !user.tenant || user.deletedAt || user.tenant.deletedAt) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const moduleAccesses = await this.prisma.tenantModuleAccess.findMany({
      where: {
        tenantId: user.tenantId,
        isEnabled: true,
      },
      orderBy: [{ moduleKey: 'asc' }],
    });

    return {
      id: user.id,
      sub: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      roles: user.memberships.map((m) => m.role.name),
      mustChangePassword: user.mustChangePassword,
      passwordExpired: this.isPasswordExpired(user.passwordChangedAt),
      enabledModules: moduleAccesses.map((m) => m.moduleKey),
    };
  }

  async changePassword(currentUser: any, dto: ChangePasswordDto, meta?: { ipAddress?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: this.getCurrentUserId(currentUser) ?? undefined },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) {
      throw new UnauthorizedException('Contraseña actual inválida');
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      },
    });

    await this.writeAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'auth.change_password',
      entityType: 'User',
      entityId: user.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {},
    });

    return { success: true };
  }

  async setupMfa(currentUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: this.getCurrentUserId(currentUser) ?? undefined },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const secret = speakeasy.generateSecret({
      name: `${currentUser?.tenantSlug || 'tenant'}:${user.email}`,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfaSecretEnc: secret.base32,
        mfaEnabled: false,
      },
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  async confirmMfa(currentUser: any, code: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: this.getCurrentUserId(currentUser) ?? undefined },
    });

    if (!user || !user.mfaSecretEnc) {
      throw new UnauthorizedException('MFA no inicializado');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecretEnc,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Código MFA inválido');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
      },
    });

    await this.writeAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'auth.mfa_confirm',
      entityType: 'User',
      entityId: user.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {},
    });

    return { success: true };
  }

  async verifyMfa(currentUser: any, code: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const token =
      typeof currentUser === 'string'
        ? currentUser
        : currentUser?.token ?? null;

    let currentUserId =
      typeof currentUser === 'object' && currentUser
        ? currentUser?.sub ?? currentUser?.id ?? null
        : null;

    if (!currentUserId && token) {
      const payload = await this.jwtService.verifyAsync(token);
      currentUserId = payload?.sub ?? payload?.id ?? null;
    }

    if (!currentUserId) {
      throw new UnauthorizedException('MFA no disponible');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        memberships: {
          include: {
            role: true,
          },
        },
        tenant: true,
      },
    });

    if (!user || !user.mfaSecretEnc) {
      throw new UnauthorizedException('MFA no disponible');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecretEnc,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Código MFA inválido');
    }

    const roles = user.memberships.map((m) => m.role.name);
    const passwordExpired = this.isPasswordExpired(user.passwordChangedAt);

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      id: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      roles,
      mfaVerified: true,
      mustChangePassword: user.mustChangePassword,
      passwordExpired,
    });

    await this.writeAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'auth.mfa_verify',
      entityType: 'User',
      entityId: user.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        passwordExpired,
      },
    });

    return {
      accessToken,
      mustChangePassword: user.mustChangePassword,
      passwordExpired,
    };
  }


}

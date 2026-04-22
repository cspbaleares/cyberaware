import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { decryptText, encryptText } from '../common/crypto.util';

@Injectable()
export class AuthService {
  private static readonly PASSWORD_MAX_AGE_DAYS = 180;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    authenticator.options = {
      window: 1,
      step: 30,
    };
  }

  private isPasswordExpired(passwordChangedAt: Date | null): boolean {
    if (!passwordChangedAt) {
      return true;
    }

    const maxAgeMs =
      AuthService.PASSWORD_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    return Date.now() - passwordChangedAt.getTime() >= maxAgeMs;
  }

  private async signAccessToken(payload: {
    id: string;
    tenantId: string;
    tenantSlug: string;
    email: string;
    isSuperAdmin: boolean;
    roles: string[];
    mfaEnabled: boolean;
    mustChangePassword: boolean;
    passwordExpired: boolean;
  }) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Missing JWT_SECRET');
    }

    return this.jwtService.signAsync(
      {
        sub: payload.id,
        tenantId: payload.tenantId,
        tenantSlug: payload.tenantSlug,
        email: payload.email,
        isSuperAdmin: payload.isSuperAdmin,
        roles: payload.roles,
        mfaEnabled: payload.mfaEnabled,
        mustChangePassword: payload.mustChangePassword,
        passwordExpired: payload.passwordExpired,
      },
      {
        secret,
        expiresIn: '15m',
      },
    );
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
    const tenantSlug = dto.tenantSlug.trim().toLowerCase();
    const email = dto.email.trim().toLowerCase();

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        slug: tenantSlug,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!tenant) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      await this.writeAudit({
        tenantId: tenant.id,
        action: 'auth.login.user_not_found',
        entityType: 'User',
        entityId: email,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: { tenantSlug, email },
      });

      throw new UnauthorizedException('Credenciales inválidas');
    }

    const now = new Date();

    if (user.lockedUntil && user.lockedUntil > now) {
      await this.writeAudit({
        tenantId: tenant.id,
        userId: user.id,
        action: 'auth.login.account_locked',
        entityType: 'User',
        entityId: user.id,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          tenantSlug,
          email,
          lockedUntil: user.lockedUntil.toISOString(),
        },
      });

      throw new UnauthorizedException('Cuenta temporalmente bloqueada');
    }

    const validPassword = await argon2.verify(user.passwordHash, dto.password);

    if (!validPassword) {
      const failedLoginCount = user.failedLoginCount + 1;
      const lockedUntil =
        failedLoginCount >= 5
          ? new Date(Date.now() + 15 * 60 * 1000)
          : null;

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
        action: 'auth.login.invalid_password',
        entityType: 'User',
        entityId: user.id,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          tenantSlug,
          email,
          failedLoginCount,
          lockedUntil: lockedUntil ? lockedUntil.toISOString() : null,
        },
      });

      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    });

    const passwordExpired = this.isPasswordExpired(user.passwordChangedAt);

    const memberships = await this.prisma.userRole.findMany({
      where: {
        userId: user.id,
        role: {
          tenantId: user.tenantId,
          deletedAt: null,
        },
      },
      include: {
        role: true,
      },
    });

    const roles = memberships.map((membership) => membership.role.name);

    if (user.mfaEnabled) {
      const mfaToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          email: user.email,
          stage: 'mfa_pending',
        },
        { expiresIn: '5m' },
      );

      await this.writeAudit({
        tenantId: tenant.id,
        userId: user.id,
        action: 'auth.login.password_ok_mfa_required',
        entityType: 'User',
        entityId: user.id,
        severity: 'INFO',
        status: 'SUCCESS',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          tenantSlug,
          email,
          mustChangePassword: user.mustChangePassword,
          passwordExpired,
        },
      });

      return {
        requiresMfa: true,
        mfaToken,
        mustChangePassword: user.mustChangePassword,
        passwordExpired,
      };
    }

    await this.writeAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'auth.login.success',
      entityType: 'User',
      entityId: user.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        tenantSlug,
        email,
        isSuperAdmin: user.isSuperAdmin,
      roles,
        mfaEnabled: user.mfaEnabled,
        mustChangePassword: user.mustChangePassword,
        passwordExpired,
      },
    });

    const accessToken = await this.signAccessToken({
      id: user.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      roles,
      mfaEnabled: user.mfaEnabled,
      mustChangePassword: user.mustChangePassword,
      passwordExpired,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      mustChangePassword: user.mustChangePassword,
      passwordExpired,
      user: {
        id: user.id,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        email: user.email,
        fullName: user.fullName,
        isSuperAdmin: user.isSuperAdmin,
      roles,
        mfaEnabled: user.mfaEnabled,
        mustChangePassword: user.mustChangePassword,
        passwordExpired,
      },
    };
  }

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no válido');
    }

    const secret = authenticator.generateSecret();
    const encryptedSecret = encryptText(secret);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfaSecretEnc: encryptedSecret,
        mfaEnabled: false,
      },
    });

    const issuer = 'Plataforma Ciberseguridad';
    const label = `${user.tenant.slug}:${user.email}`;
    const otpauth = authenticator.keyuri(user.email, issuer, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    await this.writeAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'auth.mfa.setup.started',
      entityType: 'User',
      entityId: user.id,
      severity: 'INFO',
      status: 'SUCCESS',
      metadata: {
        email: user.email,
      },
    });

    return {
      secret,
      otpauth,
      qrCodeDataUrl,
      manualEntryKey: secret,
      label,
      issuer,
    };
  }

  async confirmMfa(userId: string, dto: VerifyMfaDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        tenant: true,
      },
    });

    if (!user || !user.mfaSecretEnc) {
      throw new ForbiddenException('MFA no inicializado');
    }

    const secret = decryptText(user.mfaSecretEnc);
    const valid = authenticator.verify({
      token: dto.code,
      secret,
    });

    if (!valid) {
      await this.writeAudit({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'auth.mfa.setup.confirm_failed',
        entityType: 'User',
        entityId: user.id,
        severity: 'WARN',
        status: 'FAILURE',
        metadata: {
          email: user.email,
        },
      });

      throw new UnauthorizedException('Código MFA inválido');
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
      action: 'auth.mfa.setup.confirmed',
      entityType: 'User',
      entityId: user.id,
      severity: 'INFO',
      status: 'SUCCESS',
      metadata: {
        email: user.email,
      },
    });

    return {
      mfaEnabled: true,
    };
  }

  async verifyMfa(
    mfaToken: string,
    dto: VerifyMfaDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(mfaToken);
    } catch {
      throw new UnauthorizedException('MFA token inválido o expirado');
    }

    if (payload.stage !== 'mfa_pending') {
      throw new UnauthorizedException('MFA token inválido');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId,
        email: payload.email,
        isActive: true,
        deletedAt: null,
      },
      include: {
        tenant: true,
      },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecretEnc) {
      throw new UnauthorizedException('MFA no disponible');
    }

    const secret = decryptText(user.mfaSecretEnc);
    const valid = authenticator.verify({
      token: dto.code,
      secret,
    });

    if (!valid) {
      await this.writeAudit({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'auth.mfa.login.failed',
        entityType: 'User',
        entityId: user.id,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          email: user.email,
        },
      });

      throw new UnauthorizedException('Código MFA inválido');
    }

    const passwordExpired = this.isPasswordExpired(user.passwordChangedAt);

    await this.writeAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'auth.mfa.login.success',
      entityType: 'User',
      entityId: user.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        email: user.email,
        mustChangePassword: user.mustChangePassword,
        passwordExpired,
      },
    });

    const memberships = await this.prisma.userRole.findMany({
      where: {
        userId: user.id,
        role: {
          tenantId: user.tenantId,
          deletedAt: null,
        },
      },
      include: {
        role: true,
      },
    });

    const roles = memberships.map((membership) => membership.role.name);

    const accessToken = await this.signAccessToken({
      id: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
        roles,
      mfaEnabled: user.mfaEnabled,
      mustChangePassword: user.mustChangePassword,
      passwordExpired,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      mustChangePassword: user.mustChangePassword,
      passwordExpired,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        tenantSlug: user.tenant.slug,
        email: user.email,
        fullName: user.fullName,
        isSuperAdmin: user.isSuperAdmin,
        mfaEnabled: user.mfaEnabled,
        mustChangePassword: user.mustChangePassword,
        passwordExpired,
      },
    };
  }

  async changePassword(
    currentUser: any,
    dto: ChangePasswordDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: currentUser.sub,
        tenantId: currentUser.tenantId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no válido');
    }

    const validCurrent = await argon2.verify(
      user.passwordHash,
      dto.currentPassword,
    );

    if (!validCurrent) {
      await this.writeAudit({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'auth.password_change.invalid_current_password',
        entityType: 'User',
        entityId: user.id,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {},
      });

      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    const samePassword = await argon2.verify(
      user.passwordHash,
      dto.newPassword,
    );

    if (samePassword) {
      throw new BadRequestException(
        'La nueva contraseña no puede ser igual a la anterior',
      );
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });

    const changedAt = new Date();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: changedAt,
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    await this.writeAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'auth.password_change.success',
      entityType: 'User',
      entityId: user.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {},
    });

    const memberships = await this.prisma.userRole.findMany({
      where: {
        userId: user.id,
        role: {
          tenantId: user.tenantId,
          deletedAt: null,
        },
      },
      include: {
        role: true,
      },
    });

    const roles = memberships.map((membership) => membership.role.name);

    const accessToken = await this.signAccessToken({
      id: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      roles,
      mfaEnabled: user.mfaEnabled,
      mustChangePassword: false,
      passwordExpired: false,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      mustChangePassword: false,
      passwordExpired: false,
    };
  }
}

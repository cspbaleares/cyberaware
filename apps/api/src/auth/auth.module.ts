import 'dotenv/config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaEnforcedGuard } from './guards/mfa-enforced.guard';
import { PasswordChangeRequiredGuard } from './guards/password-change-required.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '3h') as any },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    MfaEnforcedGuard,
    PasswordChangeRequiredGuard,
    SuperAdminGuard,
  ],
  exports: [
    AuthService,
    JwtStrategy,
    PassportModule,
    JwtModule,
    MfaEnforcedGuard,
    PasswordChangeRequiredGuard,
    SuperAdminGuard,
  ],
})
export class AuthModule {}

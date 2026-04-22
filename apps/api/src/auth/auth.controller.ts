import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getMeta(req: Request) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.ip;

    const userAgent = req.headers['user-agent'];

    return {
      ipAddress: ipAddress ?? undefined,
      userAgent: typeof userAgent === 'string' ? userAgent : undefined,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.getMeta(req));
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  async setupMfa(@CurrentUser() user: any) {
    return this.authService.setupMfa(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/confirm')
  async confirmMfa(@CurrentUser() user: any, @Body() dto: VerifyMfaDto, @Req() req: Request) {
    return this.authService.confirmMfa(user, dto.code, this.getMeta(req));
  }

  @Post('mfa/verify')
  async verifyMfa(
    @Headers('authorization') authorization: string,
    @Body() dto: VerifyMfaDto,
    @Req() req: Request,
  ) {
    const mfaToken = authorization?.replace(/^Bearer\s+/i, '').trim();
    return this.authService.verifyMfa(mfaToken, dto.code, this.getMeta(req));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return this.authService.me(user);
  }
}

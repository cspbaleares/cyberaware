import { Module } from '@nestjs/common';
import { MailSuppressionsController } from './mail-suppressions.controller';
import { MailSuppressionsService } from './mail-suppressions.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MailSuppressionsController],
  providers: [MailSuppressionsService, PrismaService],
  exports: [MailSuppressionsService],
})
export class MailSuppressionsModule {}

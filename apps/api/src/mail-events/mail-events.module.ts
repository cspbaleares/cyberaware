import { Module } from '@nestjs/common';
import { MailEventsController } from './mail-events.controller';
import { MailEventsService } from './mail-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailSuppressionsModule } from '../mail-suppressions/mail-suppressions.module';

@Module({
  imports: [MailSuppressionsModule],
  controllers: [MailEventsController],
  providers: [MailEventsService, PrismaService],
})
export class MailEventsModule {}

import { Module } from '@nestjs/common';
import { MailDomainsController } from './mail-domains.controller';
import { MailDomainsService } from './mail-domains.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MailDomainsController],
  providers: [MailDomainsService, PrismaService],
})
export class MailDomainsModule {}

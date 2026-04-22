import { Module } from '@nestjs/common';
import { PhishingTemplatesController } from './phishing-templates.controller';
import { PhishingTemplatesService } from './phishing-templates.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PhishingTemplatesController],
  providers: [PhishingTemplatesService, PrismaService],
})
export class PhishingTemplatesModule {}

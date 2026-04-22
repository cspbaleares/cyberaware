import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationRulesController } from './automation-rules.controller';
import { AutomationRulesService } from './automation-rules.service';

@Module({
  controllers: [AutomationRulesController],
  providers: [AutomationRulesService, PrismaService],
})
export class AutomationRulesModule {}

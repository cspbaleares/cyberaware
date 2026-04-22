import { Module } from '@nestjs/common';
import { RiskScoringController } from './risk-scoring.controller';
import { RiskScoringService } from './risk-scoring.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RiskScoringController],
  providers: [RiskScoringService, PrismaService],
  exports: [RiskScoringService],
})
export class RiskScoringModule {}

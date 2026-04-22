import { Module } from '@nestjs/common';
import { PhishingSimulationsController } from './phishing-simulations.controller';
import { PhishingSimulationsService } from './phishing-simulations.service';
import { PrismaService } from '../prisma/prisma.service';
import { RiskScoringModule } from '../risk-scoring/risk-scoring.module';

@Module({
  imports: [RiskScoringModule],
  controllers: [PhishingSimulationsController],
  providers: [PhishingSimulationsService, PrismaService],
})
export class PhishingSimulationsModule {}

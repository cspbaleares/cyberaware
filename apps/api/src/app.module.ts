import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CampaignAssignmentsModule } from './campaign-assignments/campaign-assignments.module';
import { TrainingCatalogModule } from './training-catalog/training-catalog.module';
import { TrainingEnrollmentsModule } from './training-enrollments/training-enrollments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RiskScoringModule } from './risk-scoring/risk-scoring.module';
import { PhishingSimulationsModule } from './phishing-simulations/phishing-simulations.module';
import { MailDomainsModule } from './mail-domains/mail-domains.module';
import { PhishingTemplatesModule } from './phishing-templates/phishing-templates.module';
import { MailEventsModule } from './mail-events/mail-events.module';
import { MailProviderModule } from './mail-provider/mail-provider.module';
import { SimulationDispatchModule } from './simulation-dispatch/simulation-dispatch.module';
import { MailSuppressionsModule } from './mail-suppressions/mail-suppressions.module';
import { PlatformModule } from './platform/platform.module';
import { AutomationRulesModule } from './automation-rules/automation-rules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    UsersModule,
    TenantsModule,
    CampaignsModule,
    CampaignAssignmentsModule,
    TrainingCatalogModule,
    TrainingEnrollmentsModule,
    DashboardModule,
    RiskScoringModule,
    PhishingSimulationsModule,
    MailDomainsModule,
    PhishingTemplatesModule,
    MailEventsModule,
    MailProviderModule,
    SimulationDispatchModule,
    MailSuppressionsModule,
    PlatformModule,
    AutomationRulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
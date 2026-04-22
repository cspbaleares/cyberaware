import { Module } from '@nestjs/common';
import { CampaignAssignmentsController } from './campaign-assignments.controller';
import { CampaignAssignmentsService } from './campaign-assignments.service';

@Module({
  controllers: [CampaignAssignmentsController],
  providers: [CampaignAssignmentsService],
  exports: [CampaignAssignmentsService],
})
export class CampaignAssignmentsModule {}

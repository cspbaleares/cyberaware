import { Module } from '@nestjs/common';
import { TrainingEnrollmentsController } from './training-enrollments.controller';
import { TrainingEnrollmentsService } from './training-enrollments.service';

@Module({
  controllers: [TrainingEnrollmentsController],
  providers: [TrainingEnrollmentsService],
})
export class TrainingEnrollmentsModule {}

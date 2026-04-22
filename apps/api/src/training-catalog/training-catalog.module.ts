import { Module } from '@nestjs/common';
import { TrainingCatalogController } from './training-catalog.controller';
import { TrainingCatalogService } from './training-catalog.service';

@Module({
  controllers: [TrainingCatalogController],
  providers: [TrainingCatalogService],
})
export class TrainingCatalogModule {}

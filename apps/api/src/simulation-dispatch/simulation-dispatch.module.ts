import { Module } from '@nestjs/common';
import { SimulationDispatchController } from './simulation-dispatch.controller';
import { SimulationDispatchService } from './simulation-dispatch.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailProviderModule } from '../mail-provider/mail-provider.module';

@Module({
  imports: [MailProviderModule],
  controllers: [SimulationDispatchController],
  providers: [SimulationDispatchService, PrismaService],
})
export class SimulationDispatchModule {}

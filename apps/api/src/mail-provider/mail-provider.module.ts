import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailProviderService } from './mail-provider.service';

@Module({
  imports: [ConfigModule],
  providers: [MailProviderService],
  exports: [MailProviderService],
})
export class MailProviderModule {}

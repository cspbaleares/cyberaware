import { IsIn } from 'class-validator';

export class UpdatePhishingRecipientStatusDto {
  @IsIn(['pending', 'sent', 'opened', 'clicked', 'submitted', 'reported'])
  status!: string;
}

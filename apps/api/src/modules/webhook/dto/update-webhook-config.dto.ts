import { PartialType, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateWebhookConfigDto } from './create-webhook-config.dto';

export class UpdateWebhookConfigDto extends PartialType(
  OmitType(CreateWebhookConfigDto, ['clinicId'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

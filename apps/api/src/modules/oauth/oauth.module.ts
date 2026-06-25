import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';

import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  imports: [AuditModule],
  providers: [OAuthService],
  controllers: [OAuthController],
  exports: [OAuthService],
})
export class OAuthModule {}

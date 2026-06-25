import { Module, forwardRef } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';


@Module({
  imports: [AuditModule, NotificationModule, forwardRef(() => AuthModule)],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

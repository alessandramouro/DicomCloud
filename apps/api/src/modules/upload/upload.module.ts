import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';

@Module({
  imports: [
    MulterModule.register({ storage: multer.memoryStorage() }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}

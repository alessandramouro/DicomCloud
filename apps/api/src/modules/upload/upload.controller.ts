import {
  Controller, Post, UseInterceptors, UploadedFile,
  BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('uploads')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'uploads', version: '1' })
export class UploadController {
  constructor(private readonly configService: ConfigService) {}

  @Post('image')
  @RequirePermissions('clinics:write')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a clinic logo or other image' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Somente imagens JPEG, PNG, WebP e SVG são aceitas'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');

    const storagePath = this.configService.get<string>('storage.localPath', './storage');
    const uploadsDir = path.join(storagePath, 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    const apiUrl = this.configService.get<string>('app.apiUrl', 'http://localhost:3001');
    const url = `${apiUrl}/uploads/${filename}`;

    return { url, filename };
  }
}

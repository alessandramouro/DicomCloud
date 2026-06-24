import { Controller, Get, Post, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '@dicomcloud/types';

@ApiTags('exports')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'exports', version: '1' })
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('studies/:studyId/destinations/:destinationId')
  create(
    @Param('studyId', ParseUUIDPipe) studyId: string,
    @Param('destinationId', ParseUUIDPipe) destinationId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.exportService.createExportJob(studyId, destinationId, currentUser);
  }

  @Get('studies/:studyId')
  list(
    @Param('studyId', ParseUUIDPipe) studyId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.exportService.listExportJobs(studyId, currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.exportService.getExportJob(id, currentUser);
  }

  @Post(':id/retry')
  retry(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.exportService.retryExportJob(id, currentUser);
  }
}

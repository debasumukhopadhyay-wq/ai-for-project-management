import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string, @Query() query: any) {
    return this.documentsService.findAll(orgId, query);
  }

  @Get(':id/download-url')
  getDownloadUrl(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.documentsService.getPresignedUrl(id, orgId);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.documentsService.create(user.organizationId, user.id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.documentsService.remove(id, orgId);
  }
}

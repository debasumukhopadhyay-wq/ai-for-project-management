import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RisksService } from './risks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('risks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/risks')
export class RisksController {
  constructor(private risksService: RisksService) {}

  @Get()
  findAll(@Param('projectId') projectId: string, @CurrentUser('organizationId') orgId: string) {
    return this.risksService.findByProject(projectId, orgId);
  }

  @Get('matrix')
  getRiskMatrix(@Param('projectId') projectId: string, @CurrentUser('organizationId') orgId: string) {
    return this.risksService.getRiskMatrix(projectId, orgId);
  }

  @Post()
  create(@Param('projectId') projectId: string, @Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.risksService.create(projectId, orgId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.risksService.update(id, orgId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.risksService.remove(id, orgId);
  }
}

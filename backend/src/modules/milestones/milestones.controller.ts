import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MilestonesService } from './milestones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('milestones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/milestones')
export class MilestonesController {
  constructor(private milestonesService: MilestonesService) {}

  @Get()
  findAll(@Param('projectId') projectId: string, @CurrentUser('organizationId') orgId: string) {
    return this.milestonesService.findByProject(projectId, orgId);
  }

  @Post()
  create(@Param('projectId') projectId: string, @Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.milestonesService.create(projectId, orgId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.milestonesService.update(id, orgId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.milestonesService.remove(id, orgId);
  }
}

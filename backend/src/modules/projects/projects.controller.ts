import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string, @Query() query: any) {
    return this.projectsService.findAll(orgId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.projectsService.findOne(id, orgId);
  }

  @Get(':id/evm')
  @ApiOperation({ summary: 'Get Earned Value Management metrics' })
  getEVM(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.projectsService.getEVMMetrics(id, orgId);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.projectsService.create(user.organizationId, user.id, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.projectsService.update(id, orgId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.projectsService.remove(id, orgId);
  }
}

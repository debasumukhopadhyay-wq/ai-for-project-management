import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(@Param('projectId') projectId: string, @CurrentUser('organizationId') orgId: string, @Query() query: any) {
    return this.tasksService.findByProject(projectId, orgId, query);
  }

  @Get('kanban')
  @ApiOperation({ summary: 'Get Kanban board view' })
  getKanban(@Param('projectId') projectId: string, @CurrentUser('organizationId') orgId: string) {
    return this.tasksService.getKanbanBoard(projectId, orgId);
  }

  @Get('wbs')
  @ApiOperation({ summary: 'Get WBS (Work Breakdown Structure)' })
  getWBS(@Param('projectId') projectId: string, @CurrentUser('organizationId') orgId: string) {
    return this.tasksService.getWBS(projectId, orgId);
  }

  @Post()
  create(@Param('projectId') projectId: string, @Body() body: any, @CurrentUser() user: any) {
    return this.tasksService.create(projectId, user.organizationId, user.id, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.tasksService.update(id, orgId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.tasksService.remove(id, orgId);
  }
}

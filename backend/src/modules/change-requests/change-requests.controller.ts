import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChangeRequestsService } from './change-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('change-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/change-requests')
export class ChangeRequestsController {
  constructor(private crService: ChangeRequestsService) {}

  @Get()
  findAll(@Param('projectId') projectId: string, @CurrentUser('organizationId') orgId: string) {
    return this.crService.findByProject(projectId, orgId);
  }

  @Post()
  create(@Param('projectId') projectId: string, @Body() body: any, @CurrentUser() user: any) {
    return this.crService.create(projectId, user.organizationId, user.id, body);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.crService.approve(id, userId);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.crService.reject(id, reason);
  }
}

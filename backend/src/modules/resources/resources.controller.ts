import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string) {
    return this.resourcesService.findAll(orgId);
  }

  @Get('capacity')
  getCapacity(@CurrentUser('organizationId') orgId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.resourcesService.getCapacity(orgId, startDate || new Date().toISOString(), endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());
  }

  @Post()
  create(@Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.resourcesService.create(orgId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.resourcesService.update(id, orgId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.resourcesService.remove(id, orgId);
  }
}

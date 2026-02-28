import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('programs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private programsService: ProgramsService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string, @Query('portfolioId') portfolioId?: string) {
    return this.programsService.findAll(orgId, portfolioId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.programsService.findOne(id, orgId);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.programsService.getSummary(id, orgId);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.programsService.create(user.organizationId, user.id, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.programsService.update(id, orgId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.programsService.remove(id, orgId);
  }
}

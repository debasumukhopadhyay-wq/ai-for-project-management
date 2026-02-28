import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PortfoliosService } from './portfolios.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('portfolios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portfolios')
export class PortfoliosController {
  constructor(private portfoliosService: PortfoliosService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string) {
    return this.portfoliosService.findAll(orgId);
  }

  @Get('dashboard')
  getDashboard(@CurrentUser('organizationId') orgId: string) {
    return this.portfoliosService.getDashboard(orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.portfoliosService.findOne(id, orgId);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.portfoliosService.create(user.organizationId, user.id, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.portfoliosService.update(id, orgId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.portfoliosService.remove(id, orgId);
  }
}

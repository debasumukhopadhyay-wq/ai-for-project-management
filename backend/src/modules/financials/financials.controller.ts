import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialsService } from './financials.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('financials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/budgets')
export class FinancialsController {
  constructor(private financialsService: FinancialsService) {}

  @Get()
  getBudgets(@Param('projectId') projectId: string, @CurrentUser('organizationId') orgId: string) {
    return this.financialsService.getBudgets(projectId, orgId);
  }

  @Post()
  createBudget(@Param('projectId') projectId: string, @Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.financialsService.createBudget(projectId, orgId, body);
  }

  @Patch(':id')
  updateBudget(@Param('id') id: string, @Body() body: any) {
    return this.financialsService.updateBudget(id, body);
  }

  @Delete(':id')
  deleteBudget(@Param('id') id: string) {
    return this.financialsService.deleteBudget(id);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinancialsService {
  constructor(private prisma: PrismaService) {}

  async getBudgets(projectId: string, organizationId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { projectId, organizationId },
      orderBy: { budgetType: 'asc' },
    });

    const summary = {
      totalPlanned: budgets.reduce((s, b) => s + Number(b.plannedAmount), 0),
      totalActual: budgets.reduce((s, b) => s + Number(b.actualAmount), 0),
      totalForecast: budgets.reduce((s, b) => s + Number(b.forecastAmount), 0),
      capex: budgets.filter(b => b.budgetType === 'CAPEX').reduce((s, b) => s + Number(b.plannedAmount), 0),
      opex: budgets.filter(b => b.budgetType === 'OPEX').reduce((s, b) => s + Number(b.plannedAmount), 0),
    };

    return { budgets, summary };
  }

  async createBudget(projectId: string, organizationId: string, data: any) {
    return this.prisma.budget.create({ data: { ...data, projectId, organizationId } });
  }

  async updateBudget(id: string, data: any) {
    return this.prisma.budget.update({ where: { id }, data });
  }

  async deleteBudget(id: string) {
    return this.prisma.budget.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

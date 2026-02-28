import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getExecutiveDashboard(organizationId: string) {
    const [portfolioCount, programCount, projectCount, risks] = await Promise.all([
      this.prisma.portfolio.count({ where: { organizationId } }),
      this.prisma.program.count({ where: { organizationId } }),
      this.prisma.project.count({ where: { organizationId } }),
      this.prisma.risk.findMany({
        where: { organizationId, status: 'OPEN' },
        orderBy: { riskScore: 'desc' },
        take: 10,
      }),
    ]);

    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      select: { ragStatus: true, status: true, totalBudget: true, actualCost: true, percentComplete: true },
    });

    const totalBudget = projects.reduce((s, p) => s + Number(p.totalBudget), 0);
    const totalActual = projects.reduce((s, p) => s + Number(p.actualCost), 0);

    return {
      summary: {
        portfolios: portfolioCount,
        programs: programCount,
        projects: projectCount,
        totalBudget,
        totalActualCost: totalActual,
        budgetUtilization: totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0,
        avgCompletion: projects.length
          ? Math.round(projects.reduce((s, p) => s + p.percentComplete, 0) / projects.length)
          : 0,
      },
      ragDistribution: {
        green: projects.filter(p => p.ragStatus === 'GREEN').length,
        amber: projects.filter(p => p.ragStatus === 'AMBER').length,
        red: projects.filter(p => p.ragStatus === 'RED').length,
      },
      topRisks: risks,
    };
  }
}

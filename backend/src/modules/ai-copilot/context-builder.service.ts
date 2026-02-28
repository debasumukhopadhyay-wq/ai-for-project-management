import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Context Builder — Assembles rich project/program context before
 * passing to the AI model. Ensures prompts are data-driven and specific.
 */
@Injectable()
export class ContextBuilderService {
  constructor(private prisma: PrismaService) {}

  async buildProjectContext(projectId: string, organizationId: string) {
    const [project, tasks, risks, milestones, budgets] = await Promise.all([
      this.prisma.project.findFirst({
        where: { id: projectId, organizationId },
        include: {
          projectManager: { select: { firstName: true, lastName: true } },
          program: { select: { name: true } },
        },
      }),
      this.prisma.task.findMany({
        where: { projectId, organizationId },
        select: { status: true, priority: true, plannedEnd: true, title: true },
        take: 100,
      }),
      this.prisma.risk.findMany({
        where: { projectId, organizationId, status: { not: 'CLOSED' } },
        orderBy: { riskScore: 'desc' },
        take: 20,
      }),
      this.prisma.milestone.findMany({
        where: { projectId, organizationId },
        orderBy: { plannedDate: 'asc' },
      }),
      this.prisma.budget.findMany({
        where: { projectId, organizationId },
      }),
    ]);

    const budgetSummary = {
      totalPlanned: budgets.reduce((s, b) => s + Number(b.plannedAmount), 0),
      totalActual: budgets.reduce((s, b) => s + Number(b.actualAmount), 0),
      totalForecast: budgets.reduce((s, b) => s + Number(b.forecastAmount), 0),
    };

    return { project, tasks, risks, milestones, budgets: { items: budgets, summary: budgetSummary } };
  }

  async buildProgramContext(programId: string, organizationId: string) {
    const [program, projects] = await Promise.all([
      this.prisma.program.findFirst({
        where: { id: programId, organizationId },
        include: { programManager: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.project.findMany({
        where: { programId, organizationId },
        include: { projectManager: { select: { firstName: true, lastName: true } } },
      }),
    ]);
    return { program, projects };
  }

  async buildOrganizationContext(organizationId: string) {
    const [portfolios, programs, projects, risks] = await Promise.all([
      this.prisma.portfolio.findMany({
        where: { organizationId },
        include: { programs: { select: { id: true, name: true, status: true, ragStatus: true } } },
        take: 20,
      }),
      this.prisma.program.findMany({
        where: { organizationId },
        select: { id: true, name: true, status: true, ragStatus: true },
        take: 50,
      }),
      this.prisma.project.findMany({
        where: { organizationId },
        select: {
          id: true, name: true, status: true, ragStatus: true,
          percentComplete: true, totalBudget: true, actualCost: true,
        },
        take: 100,
      }),
      this.prisma.risk.findMany({
        where: { organizationId, status: 'OPEN' },
        include: { project: { select: { name: true } } },
        orderBy: { riskScore: 'desc' },
        take: 20,
      }),
    ]);
    return { portfolios, programs, projects, risks };
  }
}

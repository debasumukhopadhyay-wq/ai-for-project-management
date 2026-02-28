import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PortfoliosService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.portfolio.findMany({
      where: { organizationId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        programs: {
          select: { id: true, name: true, status: true, ragStatus: true },
        },
        _count: { select: { programs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id, organizationId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        programs: {
          include: {
            programManager: { select: { id: true, firstName: true, lastName: true } },
            projects: { select: { id: true, name: true, status: true, ragStatus: true, percentComplete: true } },
          },
        },
      },
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return portfolio;
  }

  async create(organizationId: string, createdBy: string, data: any) {
    return this.prisma.portfolio.create({
      data: { ...data, organizationId, createdBy },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findOne(id, organizationId);
    return this.prisma.portfolio.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.portfolio.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getDashboard(organizationId: string) {
    const portfolios = await this.prisma.portfolio.findMany({
      where: { organizationId },
      include: {
        programs: {
          include: { projects: { select: { ragStatus: true, percentComplete: true, actualCost: true, totalBudget: true } } },
        },
      },
    });

    return portfolios.map(p => ({
      ...p,
      totalProjects: p.programs.reduce((sum, prog) => sum + prog.projects.length, 0),
      redProjects: p.programs.flatMap(prog => prog.projects).filter(proj => proj.ragStatus === 'RED').length,
      amberProjects: p.programs.flatMap(prog => prog.projects).filter(proj => proj.ragStatus === 'AMBER').length,
      greenProjects: p.programs.flatMap(prog => prog.projects).filter(proj => proj.ragStatus === 'GREEN').length,
    }));
  }
}

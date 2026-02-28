import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, portfolioId?: string) {
    return this.prisma.program.findMany({
      where: { organizationId, ...(portfolioId && { portfolioId }) },
      include: {
        programManager: { select: { id: true, firstName: true, lastName: true } },
        portfolio: { select: { id: true, name: true } },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const program = await this.prisma.program.findFirst({
      where: { id, organizationId },
      include: {
        programManager: { select: { id: true, firstName: true, lastName: true, email: true } },
        portfolio: { select: { id: true, name: true } },
        projects: {
          include: {
            projectManager: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { tasks: true, risks: true } },
          },
        },
      },
    });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async create(organizationId: string, createdBy: string, data: any) {
    return this.prisma.program.create({ data: { ...data, organizationId, createdBy } });
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findOne(id, organizationId);
    return this.prisma.program.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.program.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getSummary(id: string, organizationId: string) {
    const program = await this.findOne(id, organizationId);
    const totalBudget = program.projects.reduce((sum, p) => sum + Number(p['totalBudget']), 0);
    const actualCost = program.projects.reduce((sum, p) => sum + Number(p['actualCost']), 0);
    const avgComplete = program.projects.length
      ? program.projects.reduce((sum, p) => sum + p['percentComplete'], 0) / program.projects.length
      : 0;
    return { ...program, summary: { totalBudget, actualCost, avgComplete } };
  }
}

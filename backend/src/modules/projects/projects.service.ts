import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, filters?: { programId?: string; status?: any; managerId?: string }) {
    return this.prisma.project.findMany({
      where: {
        organizationId,
        ...(filters?.programId && { programId: filters.programId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.managerId && { projectManagerId: filters.managerId }),
      },
      include: {
        projectManager: { select: { id: true, firstName: true, lastName: true } },
        program: { select: { id: true, name: true } },
        _count: { select: { tasks: true, risks: true, milestones: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId },
      include: {
        projectManager: { select: { id: true, firstName: true, lastName: true, email: true } },
        program: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } },
        milestones: { orderBy: { plannedDate: 'asc' } },
        _count: { select: { tasks: true, risks: true, issues: true, changeRequests: true, documents: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(organizationId: string, createdBy: string, data: any) {
    return this.prisma.project.create({ data: { ...data, organizationId, createdBy } });
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findOne(id, organizationId);
    return this.prisma.project.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getEVMMetrics(id: string, organizationId: string) {
    const project = await this.findOne(id, organizationId);
    const pv = Number(project.plannedValue) || 0;
    const ev = Number(project.earnedValue) || 0;
    const ac = Number(project.actualCost) || 0;
    const bac = Number(project.totalBudget) || 0;
    const cpi = ac > 0 ? ev / ac : 1;
    const spi = pv > 0 ? ev / pv : 1;
    const eac = cpi > 0 ? bac / cpi : bac;
    const etc = eac - ac;
    const vac = bac - eac;
    const sv = ev - pv;
    const cv = ev - ac;
    return {
      plannedValue: pv,
      earnedValue: ev,
      actualCost: ac,
      bac,
      cpi: Math.round(cpi * 100) / 100,
      spi: Math.round(spi * 100) / 100,
      eac: Math.round(eac * 100) / 100,
      etc: Math.round(etc * 100) / 100,
      vac: Math.round(vac * 100) / 100,
      sv: Math.round(sv * 100) / 100,
      cv: Math.round(cv * 100) / 100,
      schedulePerformance: spi >= 1 ? 'ON_TRACK' : spi >= 0.9 ? 'SLIGHTLY_BEHIND' : 'BEHIND',
      costPerformance: cpi >= 1 ? 'UNDER_BUDGET' : cpi >= 0.9 ? 'SLIGHTLY_OVER' : 'OVER_BUDGET',
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MilestonesService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string, organizationId: string) {
    return this.prisma.milestone.findMany({
      where: { projectId, organizationId },
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { plannedDate: 'asc' },
    });
  }

  async create(projectId: string, organizationId: string, data: any) {
    return this.prisma.milestone.create({ data: { ...data, projectId, organizationId } });
  }

  async update(id: string, organizationId: string, data: any) {
    const milestone = await this.prisma.milestone.findFirst({ where: { id, organizationId } });
    if (!milestone) throw new NotFoundException('Milestone not found');
    return this.prisma.milestone.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.milestone.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

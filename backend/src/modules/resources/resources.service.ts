import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.resource.findMany({
      where: { organizationId },
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.resource.create({ data: { ...data, organizationId } });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.resource.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.resource.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getCapacity(organizationId: string, startDate: string, endDate: string) {
    const resources = await this.prisma.resource.findMany({
      where: { organizationId, isActive: true },
      include: {
        assignments: {
          where: {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        },
      },
    });

    return resources.map(r => {
      const totalAllocation = r.assignments.reduce((sum, a) => sum + a.allocationPercent, 0);
      return {
        ...r,
        totalAllocation,
        isOverAllocated: totalAllocation > 100,
        availableCapacity: Math.max(0, r.availabilityPercent - totalAllocation),
      };
    });
  }
}

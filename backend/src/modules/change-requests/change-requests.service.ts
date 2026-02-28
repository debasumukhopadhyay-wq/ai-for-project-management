import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChangeRequestsService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string, organizationId: string) {
    return this.prisma.changeRequest.findMany({
      where: { projectId, organizationId },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(projectId: string, organizationId: string, requestedById: string, data: any) {
    const count = await this.prisma.changeRequest.count({ where: { projectId } });
    const crNumber = `CR-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    return this.prisma.changeRequest.create({
      data: { ...data, projectId, organizationId, requestedById, crNumber },
    });
  }

  async approve(id: string, approvedById: string) {
    return this.prisma.changeRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    });
  }

  async reject(id: string, rejectionReason: string) {
    return this.prisma.changeRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason },
    });
  }
}

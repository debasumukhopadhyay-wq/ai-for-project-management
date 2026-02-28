import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    organizationId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({ data: params });
  }

  async findAll(organizationId: string, filters?: { entityType?: string; userId?: string }) {
    return this.prisma.auditLog.findMany({
      where: { organizationId, ...filters },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, data: any) {
    return this.prisma.organization.update({ where: { id }, data });
  }

  async getStats(organizationId: string) {
    const [portfolios, programs, projects, users] = await Promise.all([
      this.prisma.portfolio.count({ where: { organizationId } }),
      this.prisma.program.count({ where: { organizationId } }),
      this.prisma.project.count({ where: { organizationId } }),
      this.prisma.user.count({ where: { organizationId, isActive: true } }),
    ]);
    return { portfolios, programs, projects, users };
  }
}

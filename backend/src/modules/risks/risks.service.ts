import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RisksService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string, organizationId: string) {
    return this.prisma.risk.findMany({
      where: { projectId, organizationId },
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { riskScore: 'desc' },
    });
  }

  async create(projectId: string, organizationId: string, data: any) {
    const riskScore = this.calculateRiskScore(data.probability, data.impact);
    return this.prisma.risk.create({ data: { ...data, projectId, organizationId, riskScore } });
  }

  async update(id: string, organizationId: string, data: any) {
    const risk = await this.prisma.risk.findFirst({ where: { id, organizationId } });
    if (!risk) throw new NotFoundException('Risk not found');
    if (data.probability || data.impact) {
      data.riskScore = this.calculateRiskScore(
        data.probability || risk.probability,
        data.impact || risk.impact,
      );
    }
    return this.prisma.risk.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.risk.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getRiskMatrix(projectId: string, organizationId: string) {
    const risks = await this.findByProject(projectId, organizationId);
    return {
      risks,
      summary: {
        critical: risks.filter(r => r.riskScore >= 20).length,
        high: risks.filter(r => r.riskScore >= 12 && r.riskScore < 20).length,
        medium: risks.filter(r => r.riskScore >= 6 && r.riskScore < 12).length,
        low: risks.filter(r => r.riskScore < 6).length,
        open: risks.filter(r => r.status === 'OPEN').length,
        mitigated: risks.filter(r => r.status === 'MITIGATED').length,
      },
    };
  }

  private calculateRiskScore(probability: string, impact: string): number {
    const probMap = { VERY_HIGH: 5, HIGH: 4, MEDIUM: 3, LOW: 2, VERY_LOW: 1 };
    const impactMap = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, VERY_LOW: 1 };
    return (probMap[probability] || 3) * (impactMap[impact] || 3);
  }
}

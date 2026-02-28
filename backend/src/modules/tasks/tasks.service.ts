import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string, organizationId: string, filters?: any) {
    return this.prisma.task.findMany({
      where: { projectId, organizationId, parentTaskId: null, ...filters },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        subtasks: {
          include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
        },
        milestone: { select: { id: true, name: true } },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string, organizationId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        subtasks: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(projectId: string, organizationId: string, createdBy: string, data: any) {
    return this.prisma.task.create({
      data: { ...data, projectId, organizationId, reporterId: createdBy },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findOne(id, organizationId);
    return this.prisma.task.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getKanbanBoard(projectId: string, organizationId: string) {
    const tasks = await this.findByProject(projectId, organizationId);
    const columns = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];
    return columns.reduce((board, status) => {
      board[status] = tasks.filter(t => t.status === status);
      return board;
    }, {} as Record<string, any[]>);
  }

  async getWBS(projectId: string, organizationId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { projectId, organizationId, parentTaskId: null },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        subtasks: {
          include: { subtasks: true, assignee: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { wbsCode: 'asc' },
    });
    return tasks;
  }
}

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, avatarUrl: true, phone: true, isActive: true,
        lastLoginAt: true, createdAt: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, avatarUrl: true, phone: true, isActive: true,
        lastLoginAt: true, createdAt: true, organizationId: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findOne(id, organizationId);
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 10);
      delete data.password;
    }
    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

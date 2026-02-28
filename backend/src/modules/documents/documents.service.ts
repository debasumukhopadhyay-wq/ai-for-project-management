import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class DocumentsService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private prisma: PrismaService, private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('minio.endpoint'),
      port: this.configService.get('minio.port'),
      useSSL: this.configService.get('minio.useSSL'),
      accessKey: this.configService.get('minio.accessKey'),
      secretKey: this.configService.get('minio.secretKey'),
    });
    this.bucketName = this.configService.get('minio.bucketName');
  }

  async findAll(organizationId: string, filters?: { projectId?: string; programId?: string }) {
    return this.prisma.document.findMany({
      where: { organizationId, ...filters },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, uploadedById: string, data: any) {
    return this.prisma.document.create({ data: { ...data, organizationId, uploadedById } });
  }

  async remove(id: string, organizationId: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, organizationId } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getPresignedUrl(id: string, organizationId: string): Promise<string> {
    const doc = await this.prisma.document.findFirst({ where: { id, organizationId } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.minioClient.presignedGetObject(this.bucketName, doc.fileKey, 3600);
  }
}

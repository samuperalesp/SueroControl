import { Injectable } from '@nestjs/common';
import { IPackageRepository } from '../../../domain/package/interfaces/package.interface';
import { Package } from '../../../domain/package/entities/package.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackagePrismaRepository implements IPackageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithDetails(data: {
    nombre: string;
    precio: number;
    activo: boolean;
    details: { productId: string; quantity: number }[];
  }): Promise<Package> {
    const created = await this.prisma.package.create({
      data: {
        nombre: data.nombre,
        precio: data.precio,
        activo: data.activo,
        details: {
          create: data.details,
        },
      },
      include: { details: true },
    });
    return created as unknown as Package;
  }

  async findAll(): Promise<Package[]> {
    return this.prisma.package.findMany({
      orderBy: { createdAt: 'desc' },
      include: { details: { include: { product: true } } },
    }) as Promise<Package[]>;
  }

  async findById(id: string): Promise<Package | null> {
    return this.prisma.package.findUnique({
      where: { id },
      include: { details: { include: { product: true } } },
    }) as Promise<Package | null>;
  }

  async update(id: string, data: { nombre?: string; precio?: number; activo?: boolean }): Promise<Package | null> {
    try {
      return this.prisma.package.update({
        where: { id },
        data,
        include: { details: true },
      }) as Promise<Package>;
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.packageDetail.deleteMany({ where: { packageId: id } });
      await this.prisma.package.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

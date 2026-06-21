import { Injectable } from '@nestjs/common';
import { IPackageRepository } from '../../../domain/package/interfaces/package.interface';
import type { CreatePackageData, UpdatePackageData } from '../../../domain/package/interfaces/package.interface';
import { Package } from '../../../domain/package/entities/package.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackagePrismaRepository implements IPackageRepository {
  constructor(private readonly prisma: PrismaService) {}

  private include = {
    details: { include: { product: true } },
    operatingCosts: true,
  };

  async createWithDetails(data: CreatePackageData): Promise<Package> {
    const created = await this.prisma.package.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        porcentajeMedico: data.porcentajeMedico,
        porcentajeCentro: data.porcentajeCentro,
        activo: data.activo,
        details: {
          create: data.details,
        },
        operatingCosts: {
          create: data.operatingCosts || [],
        },
      },
      include: this.include,
    });
    return created as unknown as Package;
  }

  async findAll(): Promise<Package[]> {
    return this.prisma.package.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.include,
    }) as Promise<Package[]>;
  }

  async findById(id: string): Promise<Package | null> {
    return this.prisma.package.findUnique({
      where: { id },
      include: this.include,
    }) as Promise<Package | null>;
  }

  async update(id: string, data: UpdatePackageData): Promise<Package | null> {
    try {
      const updateData: any = {};
      if (data.nombre !== undefined) updateData.nombre = data.nombre;
      if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
      if (data.precio !== undefined) updateData.precio = data.precio;
      if (data.porcentajeMedico !== undefined) updateData.porcentajeMedico = data.porcentajeMedico;
      if (data.porcentajeCentro !== undefined) updateData.porcentajeCentro = data.porcentajeCentro;
      if (data.activo !== undefined) updateData.activo = data.activo;

      if (data.details || data.operatingCosts) {
        await this.prisma.packageDetail.deleteMany({ where: { packageId: id } });
        await this.prisma.packageOperatingCost.deleteMany({ where: { packageId: id } });

        const updated = await this.prisma.package.update({
          where: { id },
          data: {
            ...updateData,
            details: data.details ? { create: data.details } : undefined,
            operatingCosts: data.operatingCosts ? { create: data.operatingCosts } : undefined,
          },
          include: this.include,
        });
        return updated as unknown as Package;
      }

      return this.prisma.package.update({
        where: { id },
        data: updateData,
        include: this.include,
      }) as Promise<Package>;
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.packageOperatingCost.deleteMany({ where: { packageId: id } });
      await this.prisma.packageDetail.deleteMany({ where: { packageId: id } });
      await this.prisma.package.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

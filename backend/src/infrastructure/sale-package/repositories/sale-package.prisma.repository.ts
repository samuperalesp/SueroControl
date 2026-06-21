import { Injectable } from '@nestjs/common';
import { ISalePackageRepository } from '../../../domain/package/interfaces/package.interface';
import { SalePackage } from '../../../domain/package/entities/sale-package.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalePackagePrismaRepository implements ISalePackageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    saleId: string;
    packageId: string;
    precioVenta: number;
    costoMedicamentos: number;
    costoOperativo: number;
    costoTotal: number;
    utilidad: number;
    porcentajeMedico: number;
    porcentajeCentro: number;
    gananciaMedico: number;
    gananciaCentro: number;
  }): Promise<SalePackage> {
    const created = await this.prisma.salePackage.create({ data });
    return created as unknown as SalePackage;
  }

  async findBySaleId(saleId: string): Promise<SalePackage[]> {
    return this.prisma.salePackage.findMany({
      where: { saleId },
      include: { package: true },
    }) as Promise<SalePackage[]>;
  }

  async findAll(): Promise<SalePackage[]> {
    return this.prisma.salePackage.findMany({
      include: { package: true, sale: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<SalePackage[]>;
  }
}

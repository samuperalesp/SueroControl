import { Injectable } from '@nestjs/common';
import { IWarehouseStockRepository } from '../../../domain/warehouse-stock/interfaces/warehouse-stock.interface';
import { WarehouseStock } from '../../../domain/warehouse-stock/entities/warehouse-stock.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WarehouseStockPrismaRepository implements IWarehouseStockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByWarehouseAndProduct(warehouseId: string, productId: string): Promise<WarehouseStock | undefined> {
    const stock = await this.prisma.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });
    return stock ?? undefined;
  }

  async findByProduct(productId: string): Promise<WarehouseStock[]> {
    return this.prisma.warehouseStock.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    }) as Promise<WarehouseStock[]>;
  }

  async findByWarehouse(warehouseId: string): Promise<WarehouseStock[]> {
    return this.prisma.warehouseStock.findMany({
      where: { warehouseId },
      orderBy: { createdAt: 'asc' },
    }) as Promise<WarehouseStock[]>;
  }

  async updateStock(warehouseId: string, productId: string, quantity: number): Promise<WarehouseStock | undefined> {
    const result = await this.prisma.warehouseStock.updateMany({
      where: {
        warehouseId,
        productId,
        stock: { gte: -quantity },
      },
      data: { stock: { increment: quantity } },
    });
    if (result.count === 0) {
      return undefined;
    }
    return this.findByWarehouseAndProduct(warehouseId, productId);
  }

  async setStock(warehouseId: string, productId: string, stock: number, stockMinimo: number): Promise<WarehouseStock> {
    const created = await this.prisma.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId, productId } },
      update: { stock, stockMinimo },
      create: { warehouseId, productId, stock, stockMinimo },
    });
    return created as WarehouseStock;
  }

  async upsert(warehouseId: string, productId: string, stock: number, stockMinimo: number): Promise<WarehouseStock> {
    const created = await this.prisma.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId, productId } },
      update: { stockMinimo },
      create: { warehouseId, productId, stock, stockMinimo },
    });
    return created as WarehouseStock;
  }
}

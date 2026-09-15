import { Injectable } from '@nestjs/common';
import { IInventoryMovementRepository, TransferMovement } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import { InventoryMovement } from '../../../domain/inventory-movement/entities/inventory-movement.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryMovementPrismaRepository implements IInventoryMovementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    productId: string;
    warehouseId: string;
    movementType: string;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    referenceType: string;
    referenceId: string;
  }): Promise<InventoryMovement> {
    const created = await this.prisma.inventoryMovement.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        movementType: data.movementType,
        quantity: data.quantity,
        stockBefore: data.stockBefore,
        stockAfter: data.stockAfter,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
      },
    });
    return created as InventoryMovement;
  }

  async findByProductId(productId: string, warehouseId?: string): Promise<InventoryMovement[]> {
    return this.prisma.inventoryMovement.findMany({
      where: {
        productId,
        ...(warehouseId ? { warehouseId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<InventoryMovement[]>;
  }

  async findAll(warehouseId?: string): Promise<InventoryMovement[]> {
    return this.prisma.inventoryMovement.findMany({
      where: {
        ...(warehouseId ? { warehouseId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    }) as Promise<InventoryMovement[]>;
  }

  async findTransfers(warehouseId?: string): Promise<TransferMovement[]> {
    let referenceIds: string[] | undefined;
    if (warehouseId) {
      const rows = await this.prisma.inventoryMovement.findMany({
        where: { referenceType: 'TRANSFER', warehouseId },
        select: { referenceId: true },
        distinct: ['referenceId'],
      });
      referenceIds = rows.map(r => r.referenceId);
      if (referenceIds.length === 0) return [];
    }

    return this.prisma.inventoryMovement.findMany({
      where: {
        referenceType: 'TRANSFER',
        ...(referenceIds ? { referenceId: { in: referenceIds } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { product: true, warehouse: true },
    });
  }
}

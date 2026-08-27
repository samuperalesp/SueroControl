import { Injectable } from '@nestjs/common';
import { IInventoryMovementRepository } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
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
}

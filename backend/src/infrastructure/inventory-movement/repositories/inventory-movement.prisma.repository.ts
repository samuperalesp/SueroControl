import { Injectable } from '@nestjs/common';
import { IInventoryMovementRepository } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import { InventoryMovement } from '../../../domain/inventory-movement/entities/inventory-movement.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryMovementPrismaRepository implements IInventoryMovementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    productId: string;
    movementType: string;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    referenceType: string;
    referenceId: string;
  }): Promise<InventoryMovement> {
    const created = await this.prisma.inventoryMovement.create({ data });
    return created as InventoryMovement;
  }

  async findByProductId(productId: string): Promise<InventoryMovement[]> {
    return this.prisma.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<InventoryMovement[]>;
  }

  async findAll(): Promise<InventoryMovement[]> {
    return this.prisma.inventoryMovement.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    }) as Promise<InventoryMovement[]>;
  }
}

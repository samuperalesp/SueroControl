import { Injectable, Inject } from '@nestjs/common';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import type { IInventoryMovementRepository } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import { InventoryMovement } from '../../../domain/inventory-movement/entities/inventory-movement.entity';

@Injectable()
export class InventoryMovementService {
  constructor(
    @Inject(INVENTORY_MOVEMENT_REPOSITORY) private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  async findAll(warehouseId?: string): Promise<InventoryMovement[]> {
    return this.movementRepository.findAll(warehouseId);
  }

  async findByProductId(productId: string, warehouseId?: string): Promise<InventoryMovement[]> {
    return this.movementRepository.findByProductId(productId, warehouseId);
  }

  async findTransfers(warehouseId?: string) {
    const movements = await this.movementRepository.findTransfers(warehouseId);

    const groups = new Map<string, typeof movements>();
    for (const movement of movements) {
      const list = groups.get(movement.referenceId) ?? [];
      list.push(movement);
      groups.set(movement.referenceId, list);
    }

    return Array.from(groups.entries())
      .map(([referenceId, list]) => {
        const exit = list.find(m => m.movementType === 'EXIT');
        const entry = list.find(m => m.movementType === 'ENTRY');

        const byProduct = new Map<string, typeof list>();
        for (const movement of list) {
          const arr = byProduct.get(movement.productId) ?? [];
          arr.push(movement);
          byProduct.set(movement.productId, arr);
        }

        const items = Array.from(byProduct.values()).map(ms => {
          const ex = ms.find(m => m.movementType === 'EXIT');
          const en = ms.find(m => m.movementType === 'ENTRY');
          return {
            productId: ms[0].productId,
            codigo: ms[0].product.codigo,
            nombre: ms[0].product.nombre,
            cantidad: (ex ?? en)!.quantity,
            stockOrigenBefore: ex?.stockBefore ?? null,
            stockOrigenAfter: ex?.stockAfter ?? null,
            stockDestinoBefore: en?.stockBefore ?? null,
            stockDestinoAfter: en?.stockAfter ?? null,
          };
        });

        return {
          id: referenceId,
          fecha: (exit ?? entry ?? list[0]).createdAt,
          origen: exit ? { id: exit.warehouse.id, nombre: exit.warehouse.nombre } : null,
          destino: entry ? { id: entry.warehouse.id, nombre: entry.warehouse.nombre } : null,
          productosDiferentes: items.length,
          totalUnidades: items.reduce((sum, item) => sum + item.cantidad, 0),
          items,
        };
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }
}

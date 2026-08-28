import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { WAREHOUSE_REPOSITORY } from '../../../domain/warehouse/interfaces/warehouse.interface';
import type { IWarehouseRepository } from '../../../domain/warehouse/interfaces/warehouse.interface';
import { Warehouse } from '../../../domain/warehouse/entities/warehouse.entity';
import { CreateWarehouseDto, UpdateWarehouseDto, TransferStockDto } from '../dtos/warehouse.dtos';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WarehouseService {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouseRepository: IWarehouseRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findActive(): Promise<Warehouse[]> {
    return this.warehouseRepository.findActive();
  }

  async findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.findAll();
  }

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    if (dto.esPrincipal) {
      const principal = await this.warehouseRepository.findPrincipal();
      if (principal) {
        throw new BadRequestException('Ya existe un almacén principal');
      }
    }
    return this.warehouseRepository.create(dto);
  }

  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundException('Almacén no encontrado');
    }

    if (warehouse.esPrincipal) {
      if (dto.activo === false) {
        throw new BadRequestException('No se puede desactivar el almacén principal');
      }
      if (dto.esPrincipal === false) {
        throw new BadRequestException('No se puede quitar el rol de principal');
      }
    } else if (dto.esPrincipal === true) {
      const principal = await this.warehouseRepository.findPrincipal();
      if (principal && principal.id !== id) {
        throw new BadRequestException('Ya existe un almacén principal');
      }
    }

    const updated = await this.warehouseRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException('Almacén no encontrado tras actualizar');
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundException('Almacén no encontrado');
    }
    if (warehouse.esPrincipal) {
      throw new BadRequestException('No se puede eliminar el almacén principal');
    }
    const updated = await this.warehouseRepository.update(id, { activo: false });
    return !!updated;
  }

  async transferStock(dto: TransferStockDto) {
    if (dto.origenId === dto.destinoId) {
      throw new BadRequestException('El almacén origen y destino deben ser diferentes');
    }

    const [origen, destino] = await Promise.all([
      this.warehouseRepository.findById(dto.origenId),
      this.warehouseRepository.findById(dto.destinoId),
    ]);
    if (!origen || !origen.activo) {
      throw new BadRequestException('Almacén origen no encontrado o inactivo');
    }
    if (!destino || !destino.activo) {
      throw new BadRequestException('Almacén destino no encontrado o inactivo');
    }

    if (!dto.lineas || dto.lineas.length === 0) {
      throw new BadRequestException('Debe incluir al menos un producto');
    }
    const seen = new Set<string>();
    for (const linea of dto.lineas) {
      if (seen.has(linea.productId)) {
        throw new BadRequestException('No se puede trasladar el mismo producto dos veces');
      }
      seen.add(linea.productId);
      if (linea.cantidad < 1) {
        throw new BadRequestException('Cantidad inválida para un producto');
      }
    }

    let effectiveDate = new Date();
    if (dto.fecha) {
      const parsed = new Date(dto.fecha + 'T00:00:00');
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException('Fecha inválida');
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsed > today) {
        throw new BadRequestException('La fecha del traslado no puede ser futura');
      }
      effectiveDate = parsed;
    }

    // Validación previa de TODOS los productos y stock suficiente antes de escribir.
    const prechecks: { productId: string; cantidad: number; sourceBefore: number }[] = [];
    for (const linea of dto.lineas) {
      const product = await this.prisma.product.findUnique({ where: { id: linea.productId } });
      if (!product) {
        throw new NotFoundException(`Product ${linea.productId} not found`);
      }
      const source = await this.prisma.warehouseStock.findUnique({
        where: { warehouseId_productId: { warehouseId: dto.origenId, productId: linea.productId } },
      });
      const sourceBefore = source?.stock ?? 0;
      if (sourceBefore < linea.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente en el almacén origen para ${product.nombre}. Disponible: ${sourceBefore}, requerido: ${linea.cantidad}`
        );
      }
      prechecks.push({ productId: linea.productId, cantidad: linea.cantidad, sourceBefore });
    }

    const principal = await this.warehouseRepository.findPrincipal();
    const transferId = uuidv4();

    await this.prisma.$transaction(async tx => {
      for (const linea of prechecks) {
        const decremented = await tx.warehouseStock.updateMany({
          where: { warehouseId: dto.origenId, productId: linea.productId, stock: { gte: linea.cantidad } },
          data: { stock: { decrement: linea.cantidad } },
        });
        if (decremented.count === 0) {
          throw new BadRequestException('No se pudo descontar el stock del almacén origen');
        }

        const destStock = await tx.warehouseStock.findUnique({
          where: { warehouseId_productId: { warehouseId: dto.destinoId, productId: linea.productId } },
        });
        const destBefore = destStock?.stock ?? 0;

        await tx.warehouseStock.upsert({
          where: { warehouseId_productId: { warehouseId: dto.destinoId, productId: linea.productId } },
          update: { stock: { increment: linea.cantidad } },
          create: { warehouseId: dto.destinoId, productId: linea.productId, stock: linea.cantidad, stockMinimo: 0 },
        });

        if (principal) {
          if (principal.id === dto.origenId) {
            await tx.product.update({ where: { id: linea.productId }, data: { stockActual: { decrement: linea.cantidad } } });
          }
          if (principal.id === dto.destinoId) {
            await tx.product.update({ where: { id: linea.productId }, data: { stockActual: { increment: linea.cantidad } } });
          }
        }

        await tx.inventoryMovement.create({
          data: {
            productId: linea.productId,
            warehouseId: dto.origenId,
            movementType: 'EXIT',
            quantity: linea.cantidad,
            stockBefore: linea.sourceBefore,
            stockAfter: linea.sourceBefore - linea.cantidad,
            referenceType: 'TRANSFER',
            referenceId: transferId,
            createdAt: effectiveDate,
          },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: linea.productId,
            warehouseId: dto.destinoId,
            movementType: 'ENTRY',
            quantity: linea.cantidad,
            stockBefore: destBefore,
            stockAfter: destBefore + linea.cantidad,
            referenceType: 'TRANSFER',
            referenceId: transferId,
            createdAt: effectiveDate,
          },
        });
      }
    });

    return {
      id: transferId,
      origenId: dto.origenId,
      destinoId: dto.destinoId,
      fecha: effectiveDate,
      cantidadLineas: dto.lineas.length,
    };
  }
}

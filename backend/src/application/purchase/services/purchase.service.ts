import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PURCHASE_REPOSITORY } from '../../../domain/purchase/interfaces/purchase.interface';
import type { IPurchaseRepository } from '../../../domain/purchase/interfaces/purchase.interface';
import { PRODUCT_REPOSITORY } from '../../../domain/product/interfaces/product.interface';
import type { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import type { IInventoryMovementRepository } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import { TERCERO_REPOSITORY } from '../../../domain/tercero/interfaces/tercero.interface';
import type { ITerceroRepository } from '../../../domain/tercero/interfaces/tercero.interface';
import { WAREHOUSE_REPOSITORY } from '../../../domain/warehouse/interfaces/warehouse.interface';
import type { IWarehouseRepository } from '../../../domain/warehouse/interfaces/warehouse.interface';
import { WAREHOUSE_STOCK_REPOSITORY } from '../../../domain/warehouse-stock/interfaces/warehouse-stock.interface';
import type { IWarehouseStockRepository } from '../../../domain/warehouse-stock/interfaces/warehouse-stock.interface';
import { Purchase } from '../../../domain/purchase/entities/purchase.entity';
import { CreatePurchaseDto, UpdatePurchaseDto } from '../dtos/purchase.dtos';

@Injectable()
export class PurchaseService {
  constructor(
    @Inject(PURCHASE_REPOSITORY) private readonly purchaseRepository: IPurchaseRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY) private readonly movementRepository: IInventoryMovementRepository,
    @Inject(TERCERO_REPOSITORY) private readonly terceroRepository: ITerceroRepository,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouseRepository: IWarehouseRepository,
    @Inject(WAREHOUSE_STOCK_REPOSITORY) private readonly warehouseStockRepository: IWarehouseStockRepository,
  ) {}

  private async resolveWarehouseId(warehouseId?: string): Promise<string> {
    if (warehouseId) {
      const warehouse = await this.warehouseRepository.findById(warehouseId);
      if (!warehouse || !warehouse.activo) {
        throw new BadRequestException('Almacén no encontrado o inactivo');
      }
      return warehouse.id;
    }
    const principal = await this.warehouseRepository.findPrincipal();
    if (!principal) {
      throw new BadRequestException('No existe un almacén principal configurado');
    }
    return principal.id;
  }

  private async isPrincipalWarehouse(warehouseId: string): Promise<boolean> {
    const principal = await this.warehouseRepository.findPrincipal();
    return principal?.id === warehouseId;
  }

  private async applyEntry(
    warehouseId: string,
    isPrincipal: boolean,
    productId: string,
    quantity: number,
  ): Promise<{ stockBefore: number; stockAfter: number }> {
    let current = await this.warehouseStockRepository.findByWarehouseAndProduct(warehouseId, productId);
    const stockBefore = current?.stock ?? 0;
    if (!current) {
      await this.warehouseStockRepository.upsert(warehouseId, productId, 0, 0);
    }
    const updated = await this.warehouseStockRepository.updateStock(warehouseId, productId, quantity);
    if (!updated) {
      throw new BadRequestException(`No se pudo actualizar el stock del producto ${productId} en el almacén`);
    }
    if (isPrincipal) {
      await this.productRepository.updateStock(productId, quantity);
    }
    return { stockBefore, stockAfter: updated.stock };
  }

  async create(dto: CreatePurchaseDto): Promise<Purchase> {
    const tipo = dto.tipo || 'COMPRA';
    const warehouseId = await this.resolveWarehouseId(dto.warehouseId);
    const isPrincipal = await this.isPrincipalWarehouse(warehouseId);

    if (dto.terceroId) {
      const tercero = await this.terceroRepository.findById(dto.terceroId);
      if (!tercero) throw new NotFoundException('Tercero no encontrado');
      if (tercero.tipoRelacion !== 'PROVEEDOR' && tercero.tipoRelacion !== 'CLIENTE_PROVEEDOR') {
        throw new BadRequestException('El tercero debe ser de tipo PROVEEDOR o CLIENTE_PROVEEDOR');
      }
    }

    let total = 0;
    const detailEntries: { productId: string; quantity: number; unitCost: number; subTotal: number }[] = [];

    for (const detail of dto.details) {
      const product = await this.productRepository.findById(detail.productId);
      if (!product) throw new NotFoundException(`Product ${detail.productId} not found`);

      const subTotal = detail.quantity * detail.unitCost;
      total += subTotal;
      detailEntries.push({
        productId: detail.productId,
        quantity: detail.quantity,
        unitCost: detail.unitCost,
        subTotal,
      });

      if (tipo === 'COMPRA') {
        const { stockBefore, stockAfter } = await this.applyEntry(warehouseId, isPrincipal, detail.productId, detail.quantity);
        await this.movementRepository.create({
          productId: detail.productId,
          warehouseId,
          movementType: 'ENTRY',
          quantity: detail.quantity,
          stockBefore,
          stockAfter,
          referenceType: 'PURCHASE',
          referenceId: '',
        });
      }
    }

    const purchase = await this.purchaseRepository.createWithDetails({
      tipo,
      pedidoId: dto.pedidoId,
      facturaNumero: dto.facturaNumero,
      terceroId: dto.terceroId,
      warehouseId,
      total,
      fechaCompra: dto.fechaCompra ? new Date(dto.fechaCompra + 'T00:00:00') : new Date(),
      details: detailEntries,
    });

    if (tipo === 'COMPRA') {
      for (const detail of dto.details) {
        const current = await this.warehouseStockRepository.findByWarehouseAndProduct(warehouseId, detail.productId);
        const stockAfter = current?.stock ?? 0;
        await this.movementRepository.create({
          productId: detail.productId,
          warehouseId,
          movementType: 'ENTRY',
          quantity: detail.quantity,
          stockBefore: stockAfter - detail.quantity,
          stockAfter,
          referenceType: 'PURCHASE',
          referenceId: purchase.id,
        });
      }
    }

    return purchase;
  }

  async findAll(warehouseId?: string): Promise<Purchase[]> {
    return this.purchaseRepository.findAll(warehouseId);
  }

  async findById(id: string): Promise<Purchase> {
    const purchase = await this.purchaseRepository.findById(id);
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async updatePedido(id: string, dto: UpdatePurchaseDto): Promise<Purchase> {
    const pedido = await this.purchaseRepository.findById(id);
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.tipo !== 'PEDIDO') throw new BadRequestException('Solo se pueden editar pedidos en estado PEDIDO');

    if (dto.terceroId !== undefined) {
      if (!dto.terceroId) throw new BadRequestException('El proveedor no puede quedar vacío');
      const tercero = await this.terceroRepository.findById(dto.terceroId);
      if (!tercero) throw new NotFoundException('Proveedor no encontrado');
      if (tercero.tipoRelacion !== 'PROVEEDOR' && tercero.tipoRelacion !== 'CLIENTE_PROVEEDOR') {
        throw new BadRequestException('El tercero debe ser de tipo PROVEEDOR o CLIENTE_PROVEEDOR');
      }
    }

    let warehouseId: string | undefined;
    if (dto.warehouseId !== undefined) {
      warehouseId = await this.resolveWarehouseId(dto.warehouseId);
    }

    let details = pedido.details?.map(d => ({ productId: d.productId, quantity: d.quantity, unitCost: d.unitCost, subTotal: d.subTotal })) || [];

    if (dto.details) {
      if (dto.details.length === 0) throw new BadRequestException('El pedido debe tener al menos un producto');
      details = [];
      let total = 0;
      for (const detail of dto.details) {
        const product = await this.productRepository.findById(detail.productId);
        if (!product) throw new NotFoundException(`Producto ${detail.productId} no encontrado`);
        const subTotal = detail.quantity * detail.unitCost;
        total += subTotal;
        details.push({ productId: detail.productId, quantity: detail.quantity, unitCost: detail.unitCost, subTotal });
      }
      const updated = await this.purchaseRepository.update(id, { terceroId: dto.terceroId, warehouseId, fechaCompra: dto.fechaCompra ? new Date(dto.fechaCompra + 'T00:00:00') : undefined, total, details });
      if (!updated) throw new NotFoundException('Error al actualizar pedido');
      return updated;
    }

    const updateData: any = { terceroId: dto.terceroId };
    if (warehouseId !== undefined) updateData.warehouseId = warehouseId;
    if (dto.fechaCompra !== undefined) updateData.fechaCompra = new Date(dto.fechaCompra + 'T00:00:00');
    const updated = await this.purchaseRepository.update(id, updateData);
    if (!updated) throw new NotFoundException('Error al actualizar pedido');
    return updated;
  }

  async convertPedidoToCompra(pedidoId: string): Promise<Purchase> {
    const pedido = await this.purchaseRepository.findById(pedidoId);
    if (!pedido) throw new NotFoundException('Purchase order not found');
    if (pedido.tipo === 'COMPRA') throw new BadRequestException('This purchase is already a COMPRA');

    if (!pedido.details || pedido.details.length === 0) {
      throw new BadRequestException('Purchase order has no details');
    }

    const warehouseId = await this.resolveWarehouseId(pedido.warehouseId);
    const isPrincipal = await this.isPrincipalWarehouse(warehouseId);

    for (const detail of pedido.details) {
      const product = await this.productRepository.findById(detail.productId);
      if (!product) throw new NotFoundException(`Product ${detail.productId} not found`);

      const { stockBefore, stockAfter } = await this.applyEntry(warehouseId, isPrincipal, detail.productId, detail.quantity);

      await this.movementRepository.create({
        productId: detail.productId,
        warehouseId,
        movementType: 'ENTRY',
        quantity: detail.quantity,
        stockBefore,
        stockAfter,
        referenceType: 'PURCHASE',
        referenceId: pedidoId,
      });
    }

    const updated = await this.purchaseRepository.update(pedidoId, { tipo: 'COMPRA' });
    if (!updated) throw new NotFoundException('Failed to update purchase order');
    return updated;
  }
}

import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PURCHASE_REPOSITORY } from '../../../domain/purchase/interfaces/purchase.interface';
import type { IPurchaseRepository } from '../../../domain/purchase/interfaces/purchase.interface';
import { PRODUCT_REPOSITORY } from '../../../domain/product/interfaces/product.interface';
import type { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import type { IInventoryMovementRepository } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import { TERCERO_REPOSITORY } from '../../../domain/tercero/interfaces/tercero.interface';
import type { ITerceroRepository } from '../../../domain/tercero/interfaces/tercero.interface';
import { Purchase } from '../../../domain/purchase/entities/purchase.entity';
import { CreatePurchaseDto } from '../dtos/purchase.dtos';

@Injectable()
export class PurchaseService {
  constructor(
    @Inject(PURCHASE_REPOSITORY) private readonly purchaseRepository: IPurchaseRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY) private readonly movementRepository: IInventoryMovementRepository,
    @Inject(TERCERO_REPOSITORY) private readonly terceroRepository: ITerceroRepository,
  ) {}

  async create(dto: CreatePurchaseDto): Promise<Purchase> {
    const tipo = dto.tipo || 'COMPRA';

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
        const stockBefore = product.stockActual;
        const stockAfter = stockBefore + detail.quantity;
        await this.productRepository.updateStock(detail.productId, detail.quantity);
        await this.movementRepository.create({
          productId: detail.productId,
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
      total,
      details: detailEntries,
    });

    if (tipo === 'COMPRA') {
      for (const detail of dto.details) {
        const product = await this.productRepository.findById(detail.productId);
        if (product) {
          await this.movementRepository.create({
            productId: detail.productId,
            movementType: 'ENTRY',
            quantity: detail.quantity,
            stockBefore: product.stockActual - detail.quantity,
            stockAfter: product.stockActual,
            referenceType: 'PURCHASE',
            referenceId: purchase.id,
          });
        }
      }
    }

    return purchase;
  }

  async findAll(): Promise<Purchase[]> {
    return this.purchaseRepository.findAll();
  }

  async findById(id: string): Promise<Purchase> {
    const purchase = await this.purchaseRepository.findById(id);
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async convertPedidoToCompra(pedidoId: string): Promise<Purchase> {
    const pedido = await this.purchaseRepository.findById(pedidoId);
    if (!pedido) throw new NotFoundException('Purchase order not found');
    if (pedido.tipo === 'COMPRA') throw new BadRequestException('This purchase is already a COMPRA');

    if (!pedido.details || pedido.details.length === 0) {
      throw new BadRequestException('Purchase order has no details');
    }

    for (const detail of pedido.details) {
      const product = await this.productRepository.findById(detail.productId);
      if (!product) throw new NotFoundException(`Product ${detail.productId} not found`);

      const stockBefore = product.stockActual;
      const stockAfter = stockBefore + detail.quantity;

      await this.productRepository.updateStock(detail.productId, detail.quantity);

      await this.movementRepository.create({
        productId: detail.productId,
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

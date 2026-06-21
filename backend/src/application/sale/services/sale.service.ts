import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { SALE_REPOSITORY } from '../../../domain/sale/interfaces/sale.interface';
import type { ISaleRepository, SaleSearchParams } from '../../../domain/sale/interfaces/sale.interface';
import { PRODUCT_REPOSITORY } from '../../../domain/product/interfaces/product.interface';
import type { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import type { IInventoryMovementRepository } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import { TERCERO_REPOSITORY } from '../../../domain/tercero/interfaces/tercero.interface';
import type { ITerceroRepository } from '../../../domain/tercero/interfaces/tercero.interface';
import { Sale } from '../../../domain/sale/entities/sale.entity';
import { CreateSaleDto, UpdateSaleDto, CancelSaleDto } from '../dtos/sale.dtos';

@Injectable()
export class SaleService {
  constructor(
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY) private readonly movementRepository: IInventoryMovementRepository,
    @Inject(TERCERO_REPOSITORY) private readonly terceroRepository: ITerceroRepository,
  ) {}

  async create(dto: CreateSaleDto): Promise<Sale> {
    if (dto.terceroId) {
      const tercero = await this.terceroRepository.findById(dto.terceroId);
      if (!tercero) throw new NotFoundException('Tercero no encontrado');
      if (tercero.tipoRelacion !== 'CLIENTE' && tercero.tipoRelacion !== 'CLIENTE_PROVEEDOR') {
        throw new BadRequestException('El tercero debe ser de tipo CLIENTE o CLIENTE_PROVEEDOR');
      }
    }

    let total = 0;
    const detailEntries: { productId: string; quantity: number; unitPrice: number; subTotal: number }[] = [];

    for (const detail of dto.details) {
      const product = await this.productRepository.findById(detail.productId);
      if (!product) throw new NotFoundException(`Product ${detail.productId} not found`);
      if (product.stockActual < detail.quantity) {
        throw new BadRequestException(`Stock insuficiente para ${product.nombre}. Disponible: ${product.stockActual}, solicitado: ${detail.quantity}`);
      }

      const subTotal = detail.quantity * detail.unitPrice;
      total += subTotal;

      await this.productRepository.updateStock(detail.productId, -detail.quantity);

      detailEntries.push({
        productId: detail.productId,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        subTotal,
      });
    }

    const maxCons = await this.saleRepository.findMaxConsecutivo();
    const consecutivo = maxCons + 1;

    const sale = await this.saleRepository.createWithDetails({
      consecutivo,
      terceroId: dto.terceroId,
      total,
      details: detailEntries,
    });

    for (const detail of detailEntries) {
      const product = await this.productRepository.findById(detail.productId);
      if (product) {
        await this.movementRepository.create({
          productId: detail.productId,
          movementType: 'EXIT',
          quantity: detail.quantity,
          stockBefore: product.stockActual + detail.quantity,
          stockAfter: product.stockActual,
          referenceType: 'SALE',
          referenceId: sale.id,
        });
      }
    }

    return sale;
  }

  async findAll(params?: SaleSearchParams): Promise<Sale[]> {
    return this.saleRepository.findAll(params);
  }

  async findById(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findById(id);
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }

  async findByConsecutivo(consecutivo: number): Promise<Sale> {
    const sale = await this.saleRepository.findByConsecutivo(consecutivo);
    if (!sale) throw new NotFoundException(`Venta #${consecutivo} no encontrada`);
    return sale;
  }

  async update(id: string, dto: UpdateSaleDto): Promise<Sale> {
    const sale = await this.findById(id);
    if (sale.estado !== 'ACTIVA') {
      throw new BadRequestException('No se puede editar una venta anulada');
    }

    if (dto.terceroId) {
      const tercero = await this.terceroRepository.findById(dto.terceroId);
      if (!tercero) throw new NotFoundException('Tercero no encontrado');
      if (tercero.tipoRelacion !== 'CLIENTE' && tercero.tipoRelacion !== 'CLIENTE_PROVEEDOR') {
        throw new BadRequestException('El tercero debe ser de tipo CLIENTE o CLIENTE_PROVEEDOR');
      }
    }

    return this.saleRepository.update(id, { terceroId: dto.terceroId });
  }

  async cancel(id: string, dto: CancelSaleDto): Promise<Sale> {
    const sale = await this.findById(id);
    if (sale.estado !== 'ACTIVA') {
      throw new BadRequestException('La venta ya está anulada');
    }

    for (const detail of sale.details || []) {
      if (detail.productId) {
        await this.productRepository.updateStock(detail.productId, detail.quantity);
        const product = await this.productRepository.findById(detail.productId);
        if (product) {
          await this.movementRepository.create({
            productId: detail.productId,
            movementType: 'ENTRY',
            quantity: detail.quantity,
            stockBefore: product.stockActual - detail.quantity,
            stockAfter: product.stockActual,
            referenceType: 'CANCEL_SALE',
            referenceId: sale.id,
          });
        }
      }
    }

    return this.saleRepository.cancel(id, dto.motivo);
  }

  async getComprobante(id: string): Promise<any> {
    const sale = await this.findById(id);
    const tercero = sale.terceroId ? await this.terceroRepository.findById(sale.terceroId) : null;

    return {
      comprobante: `FV-${String(sale.consecutivo).padStart(6, '0')}`,
      consecutivo: sale.consecutivo,
      fecha: sale.createdAt,
      estado: sale.estado,
      anuladaMotivo: sale.anuladaMotivo,
      cliente: tercero ? {
        nombre: tercero.tipoPersona === 'NATURAL' ? `${tercero.nombres} ${tercero.apellidos}` : tercero.razonSocial,
        documento: `${tercero.tipoDocumento} ${tercero.numeroDocumento}${tercero.digitoVerificacion ? '-' + tercero.digitoVerificacion : ''}`,
        direccion: tercero.direccion,
        telefono: tercero.telefono,
      } : null,
      items: sale.details?.map(d => ({
        producto: d.productId,
        cantidad: d.quantity,
        precioUnitario: d.unitPrice,
        subtotal: d.subTotal,
      })) || [],
      total: sale.total,
    };
  }
}

import { Injectable, NotFoundException, BadRequestException, Inject, ForbiddenException } from '@nestjs/common';
import { SALE_REPOSITORY, SALE_HISTORY_REPOSITORY } from '../../../domain/sale/interfaces/sale.interface';
import type { ISaleRepository, ISaleHistoryRepository, SaleSearchParams } from '../../../domain/sale/interfaces/sale.interface';
import { PRODUCT_REPOSITORY } from '../../../domain/product/interfaces/product.interface';
import type { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { PACKAGE_REPOSITORY, SALE_PACKAGE_REPOSITORY } from '../../../domain/package/interfaces/package.interface';
import type { IPackageRepository, ISalePackageRepository } from '../../../domain/package/interfaces/package.interface';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import type { IInventoryMovementRepository } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import { TERCERO_REPOSITORY } from '../../../domain/tercero/interfaces/tercero.interface';
import type { ITerceroRepository } from '../../../domain/tercero/interfaces/tercero.interface';
import { WAREHOUSE_REPOSITORY } from '../../../domain/warehouse/interfaces/warehouse.interface';
import type { IWarehouseRepository } from '../../../domain/warehouse/interfaces/warehouse.interface';
import { WAREHOUSE_STOCK_REPOSITORY } from '../../../domain/warehouse-stock/interfaces/warehouse-stock.interface';
import type { IWarehouseStockRepository } from '../../../domain/warehouse-stock/interfaces/warehouse-stock.interface';
import { Sale } from '../../../domain/sale/entities/sale.entity';
import { CreateSaleDto, UpdateSaleDto, CancelSaleDto } from '../dtos/sale.dtos';

const ESTADOS_NO_EDITABLES = ['ANULADA', 'FINALIZADA'];

@Injectable()
export class SaleService {
  constructor(
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(SALE_HISTORY_REPOSITORY) private readonly historyRepository: ISaleHistoryRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(PACKAGE_REPOSITORY) private readonly packageRepository: IPackageRepository,
    @Inject(SALE_PACKAGE_REPOSITORY) private readonly salePackageRepository: ISalePackageRepository,
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

  private async getAvailableStock(warehouseId: string, productId: string): Promise<number> {
    const current = await this.warehouseStockRepository.findByWarehouseAndProduct(warehouseId, productId);
    return current?.stock ?? 0;
  }

  private async applyExit(
    warehouseId: string,
    isPrincipal: boolean,
    productId: string,
    quantity: number,
  ): Promise<{ stockBefore: number; stockAfter: number }> {
    const current = await this.warehouseStockRepository.findByWarehouseAndProduct(warehouseId, productId);
    const stockBefore = current?.stock ?? 0;
    if (stockBefore < quantity) {
      throw new BadRequestException('Stock insuficiente en el almacén');
    }
    const updated = await this.warehouseStockRepository.updateStock(warehouseId, productId, -quantity);
    if (!updated) {
      throw new BadRequestException('No se pudo actualizar el stock del almacén');
    }
    if (isPrincipal) {
      await this.productRepository.updateStock(productId, -quantity);
    }
    return { stockBefore, stockAfter: updated.stock };
  }

  private async applyRestore(
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
      throw new BadRequestException('No se pudo actualizar el stock del almacén');
    }
    if (isPrincipal) {
      await this.productRepository.updateStock(productId, quantity);
    }
    return { stockBefore, stockAfter: updated.stock };
  }

  async create(dto: CreateSaleDto): Promise<Sale> {
    const warehouseId = await this.resolveWarehouseId(dto.warehouseId);
    const isPrincipal = await this.isPrincipalWarehouse(warehouseId);

    if (dto.terceroId) {
      const tercero = await this.terceroRepository.findById(dto.terceroId);
      if (!tercero) throw new NotFoundException('Cliente no encontrado');
      if (tercero.tipoRelacion !== 'CLIENTE' && tercero.tipoRelacion !== 'CLIENTE_PROVEEDOR') {
        throw new BadRequestException('El tercero debe ser de tipo CLIENTE o CLIENTE_PROVEEDOR');
      }
    }

    const medico = await this.terceroRepository.findById(dto.medicoId);
    if (!medico) throw new NotFoundException('Médico no encontrado');
    if (medico.tipoRelacion !== 'MEDICO') {
      throw new BadRequestException('El médico debe ser de tipo MEDICO');
    }

    let total = 0;
    const detailEntries: { productId?: string; packageId?: string; quantity: number; unitPrice: number; subTotal: number }[] = [];
    const pendingSalePackages: {
      packageId: string;
      packageDetails: { productId: string; quantity: number }[];
      packageQty: number;
      costoMedicamentos: number;
      costoOperativo: number;
      precioVenta: number;
      costoTotal: number;
      utilidad: number;
      porcentajeMedico: number;
      porcentajeCentro: number;
    }[] = [];

    for (const detail of dto.details) {
      if (detail.packageId) {
        const pkg = await this.packageRepository.findById(detail.packageId);
        if (!pkg) throw new NotFoundException(`Paquete ${detail.packageId} no encontrado`);
        if (!pkg.details || pkg.details.length === 0) {
          throw new BadRequestException('El paquete no tiene componentes');
        }

        const packageQty = detail.quantity;
        let costoMedicamentos = 0;

        for (const comp of pkg.details) {
          const product = await this.productRepository.findById(comp.productId);
          if (!product) throw new NotFoundException(`Producto ${comp.productId} no encontrado`);
          const requiredQty = comp.quantity * packageQty;
          const available = await this.getAvailableStock(warehouseId, comp.productId);
          if (available < requiredQty) {
            throw new BadRequestException(
              `Stock insuficiente para ${product.nombre}. Disponible: ${available}, requerido: ${requiredQty}`
            );
          }
          costoMedicamentos += product.costoCompra * requiredQty;
        }

        const costoOperativo = (pkg.operatingCosts || []).reduce((sum, oc) => sum + oc.valor, 0);
        const subTotal = detail.unitPrice * packageQty;
        total += subTotal;

        for (const comp of pkg.details) {
          await this.applyExit(warehouseId, isPrincipal, comp.productId, comp.quantity * packageQty);
        }

        detailEntries.push({
          packageId: detail.packageId,
          quantity: packageQty,
          unitPrice: detail.unitPrice,
          subTotal,
        });

        pendingSalePackages.push({
          packageId: detail.packageId,
          packageDetails: pkg.details.map(d => ({ productId: d.productId, quantity: d.quantity })),
          packageQty,
          costoMedicamentos,
          costoOperativo,
          precioVenta: subTotal,
          costoTotal: costoMedicamentos + costoOperativo,
          utilidad: subTotal - (costoMedicamentos + costoOperativo),
          porcentajeMedico: pkg.porcentajeMedico,
          porcentajeCentro: pkg.porcentajeCentro,
        });

      } else if (detail.productId) {
        const product = await this.productRepository.findById(detail.productId);
        if (!product) throw new NotFoundException(`Producto ${detail.productId} no encontrado`);
        const available = await this.getAvailableStock(warehouseId, detail.productId);
        if (available < detail.quantity) {
          throw new BadRequestException(`Stock insuficiente para ${product.nombre}. Disponible: ${available}, solicitado: ${detail.quantity}`);
        }

        const subTotal = detail.quantity * detail.unitPrice;
        total += subTotal;

        await this.applyExit(warehouseId, isPrincipal, detail.productId, detail.quantity);

        detailEntries.push({
          productId: detail.productId,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          subTotal,
        });
      }
    }

    const maxCons = await this.saleRepository.findMaxConsecutivo();
    const consecutivo = maxCons + 1;

    const sale = await this.saleRepository.createWithDetails({
      consecutivo,
      terceroId: dto.terceroId,
      medicoId: dto.medicoId,
      warehouseId,
      total,
      fechaVenta: dto.fechaVenta ? new Date(dto.fechaVenta + 'T00:00:00') : new Date(),
      details: detailEntries,
    });

    for (const detail of detailEntries) {
      if (detail.packageId) {
        const spi = pendingSalePackages.find(p => p.packageId === detail.packageId);
        if (!spi) continue;

        const gananciaMedico = spi.utilidad * (spi.porcentajeMedico / 100);
        const gananciaCentro = spi.utilidad * (spi.porcentajeCentro / 100);

        await this.salePackageRepository.create({
          saleId: sale.id,
          packageId: detail.packageId,
          medicoId: dto.medicoId,
          precioVenta: spi.precioVenta,
          costoMedicamentos: spi.costoMedicamentos,
          costoOperativo: spi.costoOperativo,
          costoTotal: spi.costoTotal,
          utilidad: spi.utilidad,
          porcentajeMedico: spi.porcentajeMedico,
          porcentajeCentro: spi.porcentajeCentro,
          gananciaMedico,
          gananciaCentro,
        });

        for (const comp of spi.packageDetails) {
          const movedQty = comp.quantity * spi.packageQty;
          const stockAfter = await this.getAvailableStock(warehouseId, comp.productId);
          await this.movementRepository.create({
            productId: comp.productId,
            warehouseId,
            movementType: 'EXIT',
            quantity: movedQty,
            stockBefore: stockAfter + movedQty,
            stockAfter,
            referenceType: 'SALE',
            referenceId: sale.id,
          });
        }

      } else if (detail.productId) {
        const stockAfter = await this.getAvailableStock(warehouseId, detail.productId);
        await this.movementRepository.create({
          productId: detail.productId,
          warehouseId,
          movementType: 'EXIT',
          quantity: detail.quantity,
          stockBefore: stockAfter + detail.quantity,
          stockAfter,
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

  async update(id: string, dto: UpdateSaleDto, userId?: string): Promise<Sale> {
    const sale = await this.findById(id);

    if (ESTADOS_NO_EDITABLES.includes(sale.estado)) {
      throw new BadRequestException(`No se puede editar una venta en estado "${sale.estado}"`);
    }

    if (dto.terceroId !== undefined) {
      if (!dto.terceroId) {
        throw new BadRequestException('El cliente no puede quedar vacío');
      }
      const tercero = await this.terceroRepository.findById(dto.terceroId);
      if (!tercero) throw new NotFoundException('Cliente no encontrado');
      if (tercero.tipoRelacion !== 'CLIENTE' && tercero.tipoRelacion !== 'CLIENTE_PROVEEDOR') {
        throw new BadRequestException('El tercero debe ser de tipo CLIENTE o CLIENTE_PROVEEDOR');
      }
    }

    if (dto.medicoId !== undefined) {
      if (!dto.medicoId) {
        throw new BadRequestException('El médico no puede quedar vacío');
      }
      const medico = await this.terceroRepository.findById(dto.medicoId);
      if (!medico) throw new NotFoundException('Médico no encontrado');
      if (medico.tipoRelacion !== 'MEDICO') {
        throw new BadRequestException('El médico debe ser de tipo MEDICO');
      }
    }

    const changes: { campo: string; valorAnterior?: string; valorNuevo?: string }[] = [];

    if (dto.terceroId !== undefined && dto.terceroId !== sale.terceroId) {
      changes.push({
        campo: 'terceroId',
        valorAnterior: sale.terceroId ?? '',
        valorNuevo: dto.terceroId,
      });
    }

    if (dto.medicoId !== undefined && dto.medicoId !== sale.medicoId) {
      changes.push({
        campo: 'medicoId',
        valorAnterior: sale.medicoId ?? '',
        valorNuevo: dto.medicoId,
      });
    }

    const updateData: any = {};
    if (dto.terceroId !== undefined) updateData.terceroId = dto.terceroId;
    if (dto.medicoId !== undefined) updateData.medicoId = dto.medicoId;
    if (dto.fechaVenta !== undefined) updateData.fechaVenta = new Date(dto.fechaVenta + 'T00:00:00');

    if (dto.details) {
      let newTotal = 0;
      for (const detail of dto.details) {
        newTotal += detail.quantity * detail.unitPrice;
      }
      updateData.total = newTotal;

      changes.push({
        campo: 'details',
        valorAnterior: JSON.stringify(sale.details?.map(d => ({ productId: d.productId, packageId: d.packageId, quantity: d.quantity, unitPrice: d.unitPrice }))),
        valorNuevo: JSON.stringify(dto.details.map(d => ({ productId: d.productId, packageId: d.packageId, quantity: d.quantity, unitPrice: d.unitPrice }))),
      });
    }

    const updated = await this.saleRepository.update(id, updateData);

    for (const change of changes) {
      await this.historyRepository.create({
        saleId: id,
        campo: change.campo,
        valorAnterior: change.valorAnterior,
        valorNuevo: change.valorNuevo,
        userId,
      });
    }

    return updated;
  }

  async cancel(id: string, dto: CancelSaleDto): Promise<Sale> {
    const sale = await this.findById(id);
    if (sale.estado !== 'ACTIVA') {
      throw new BadRequestException('La venta ya está anulada');
    }

    const warehouseId = await this.resolveWarehouseId(sale.warehouseId);
    const isPrincipal = await this.isPrincipalWarehouse(warehouseId);

    for (const detail of sale.details || []) {
      if (detail.productId) {
        const { stockAfter } = await this.applyRestore(warehouseId, isPrincipal, detail.productId, detail.quantity);
        await this.movementRepository.create({
          productId: detail.productId,
          warehouseId,
          movementType: 'ENTRY',
          quantity: detail.quantity,
          stockBefore: stockAfter - detail.quantity,
          stockAfter,
          referenceType: 'CANCEL_SALE',
          referenceId: sale.id,
        });
      } else if (detail.packageId) {
        const pkg = await this.packageRepository.findById(detail.packageId);
        if (pkg?.details) {
          for (const comp of pkg.details) {
            const restoreQty = comp.quantity * detail.quantity;
            const { stockAfter } = await this.applyRestore(warehouseId, isPrincipal, comp.productId, restoreQty);
            await this.movementRepository.create({
              productId: comp.productId,
              warehouseId,
              movementType: 'ENTRY',
              quantity: restoreQty,
              stockBefore: stockAfter - restoreQty,
              stockAfter,
              referenceType: 'CANCEL_SALE',
              referenceId: sale.id,
            });
          }
        }
      }
    }

    return this.saleRepository.cancel(id, dto.motivo);
  }

  async getComprobante(id: string): Promise<any> {
    const sale = await this.findById(id);
    const tercero = sale.terceroId ? await this.terceroRepository.findById(sale.terceroId) : null;

    const items: { producto: string; cantidad: number; precioUnitario: number; subtotal: number }[] = [];
    for (const d of sale.details || []) {
      let nombre = 'Ítem';
      if (d.productId) {
        const p = await this.productRepository.findById(d.productId);
        nombre = p ? `${p.codigo} - ${p.nombre}` : d.productId;
      } else if (d.packageId) {
        const pkg = await this.packageRepository.findById(d.packageId);
        nombre = pkg ? `Paquete: ${pkg.nombre}` : `Paquete ${d.packageId}`;
      }
      items.push({
        producto: nombre,
        cantidad: d.quantity,
        precioUnitario: d.unitPrice,
        subtotal: d.subTotal,
      });
    }

    return {
      comprobante: `FV-${String(sale.consecutivo).padStart(6, '0')}`,
      consecutivo: sale.consecutivo,
      fecha: sale.fechaVenta ?? sale.createdAt,
      estado: sale.estado,
      anuladaMotivo: sale.anuladaMotivo,
      cliente: tercero ? {
        nombre: tercero.tipoPersona === 'NATURAL' ? `${tercero.nombres} ${tercero.apellidos}` : tercero.razonSocial,
        documento: `${tercero.tipoDocumento} ${tercero.numeroDocumento}${tercero.digitoVerificacion ? '-' + tercero.digitoVerificacion : ''}`,
        direccion: tercero.direccion,
        telefono: tercero.telefono,
      } : null,
      items,
      total: sale.total,
    };
  }
}

import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { SALE_REPOSITORY } from '../../../domain/sale/interfaces/sale.interface';
import type { ISaleRepository, SaleSearchParams } from '../../../domain/sale/interfaces/sale.interface';
import { PRODUCT_REPOSITORY } from '../../../domain/product/interfaces/product.interface';
import type { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { PACKAGE_REPOSITORY, SALE_PACKAGE_REPOSITORY } from '../../../domain/package/interfaces/package.interface';
import type { IPackageRepository, ISalePackageRepository } from '../../../domain/package/interfaces/package.interface';
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
    @Inject(PACKAGE_REPOSITORY) private readonly packageRepository: IPackageRepository,
    @Inject(SALE_PACKAGE_REPOSITORY) private readonly salePackageRepository: ISalePackageRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY) private readonly movementRepository: IInventoryMovementRepository,
    @Inject(TERCERO_REPOSITORY) private readonly terceroRepository: ITerceroRepository,
  ) {}

  async create(dto: CreateSaleDto): Promise<Sale> {
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
          if (product.stockActual < requiredQty) {
            throw new BadRequestException(
              `Stock insuficiente para ${product.nombre}. Disponible: ${product.stockActual}, requerido: ${requiredQty}`
            );
          }
          costoMedicamentos += product.costoCompra * requiredQty;
        }

        const costoOperativo = (pkg.operatingCosts || []).reduce((sum, oc) => sum + oc.valor, 0);
        const subTotal = detail.unitPrice * packageQty;
        total += subTotal;

        for (const comp of pkg.details) {
          await this.productRepository.updateStock(comp.productId, -(comp.quantity * packageQty));
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
    }

    const maxCons = await this.saleRepository.findMaxConsecutivo();
    const consecutivo = maxCons + 1;

    const sale = await this.saleRepository.createWithDetails({
      consecutivo,
      terceroId: dto.terceroId,
      medicoId: dto.medicoId,
      total,
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
          const product = await this.productRepository.findById(comp.productId);
          if (product) {
            const movedQty = comp.quantity * spi.packageQty;
            await this.movementRepository.create({
              productId: comp.productId,
              movementType: 'EXIT',
              quantity: movedQty,
              stockBefore: product.stockActual + movedQty,
              stockAfter: product.stockActual,
              referenceType: 'SALE',
              referenceId: sale.id,
            });
          }
        }

      } else if (detail.productId) {
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
      } else if (detail.packageId) {
        const pkg = await this.packageRepository.findById(detail.packageId);
        if (pkg?.details) {
          for (const comp of pkg.details) {
            const restoreQty = comp.quantity * detail.quantity;
            await this.productRepository.updateStock(comp.productId, restoreQty);
            const product = await this.productRepository.findById(comp.productId);
            if (product) {
              await this.movementRepository.create({
                productId: comp.productId,
                movementType: 'ENTRY',
                quantity: restoreQty,
                stockBefore: product.stockActual - restoreQty,
                stockAfter: product.stockActual,
                referenceType: 'CANCEL_SALE',
                referenceId: sale.id,
              });
            }
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
      fecha: sale.createdAt,
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

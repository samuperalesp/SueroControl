import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PACKAGE_REPOSITORY, SALE_PACKAGE_REPOSITORY } from '../../../domain/package/interfaces/package.interface';
import type { IPackageRepository, ISalePackageRepository } from '../../../domain/package/interfaces/package.interface';
import { PRODUCT_REPOSITORY } from '../../../domain/product/interfaces/product.interface';
import type { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import type { IInventoryMovementRepository } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import { SALE_REPOSITORY } from '../../../domain/sale/interfaces/sale.interface';
import type { ISaleRepository } from '../../../domain/sale/interfaces/sale.interface';
import { TERCERO_REPOSITORY } from '../../../domain/tercero/interfaces/tercero.interface';
import type { ITerceroRepository } from '../../../domain/tercero/interfaces/tercero.interface';
import { Package } from '../../../domain/package/entities/package.entity';
import { CreatePackageDto, UpdatePackageDto } from '../dtos/package.dtos';
import { SalePackage } from '../../../domain/package/entities/sale-package.entity';

@Injectable()
export class PackageService {
  constructor(
    @Inject(PACKAGE_REPOSITORY) private readonly packageRepository: IPackageRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY) private readonly movementRepository: IInventoryMovementRepository,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(SALE_PACKAGE_REPOSITORY) private readonly salePackageRepository: ISalePackageRepository,
    @Inject(TERCERO_REPOSITORY) private readonly terceroRepository: ITerceroRepository,
  ) {}

  async create(dto: CreatePackageDto): Promise<Package> {
    for (const detail of dto.details) {
      const product = await this.productRepository.findById(detail.productId);
      if (!product) throw new NotFoundException(`Product ${detail.productId} not found`);
    }

    const porcentajeMedico = dto.porcentajeMedico ?? 70;
    const porcentajeCentro = dto.porcentajeCentro ?? 30;

    if (porcentajeMedico + porcentajeCentro !== 100) {
      throw new BadRequestException('La suma de porcentajes debe ser 100%');
    }

    return this.packageRepository.createWithDetails({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      precio: dto.precio,
      porcentajeMedico,
      porcentajeCentro,
      activo: dto.activo ?? true,
      details: dto.details,
      operatingCosts: dto.operatingCosts,
    });
  }

  async findAll(): Promise<Package[]> {
    return this.packageRepository.findAll();
  }

  async findById(id: string): Promise<Package> {
    const pkg = await this.packageRepository.findById(id);
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto): Promise<Package> {
    await this.findById(id);

    const pctM = dto.porcentajeMedico;
    const pctC = dto.porcentajeCentro;
    if (pctM !== undefined && pctC !== undefined && pctM + pctC !== 100) {
      throw new BadRequestException('La suma de porcentajes debe ser 100%');
    }
    if (pctM !== undefined && pctC === undefined) {
      const existing = await this.findById(id);
      if (pctM + existing.porcentajeCentro !== 100) {
        throw new BadRequestException('La suma de porcentajes debe ser 100%');
      }
    }
    if (pctC !== undefined && pctM === undefined) {
      const existing = await this.findById(id);
      if (pctC + existing.porcentajeMedico !== 100) {
        throw new BadRequestException('La suma de porcentajes debe ser 100%');
      }
    }

    const updated = await this.packageRepository.update(id, {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      precio: dto.precio,
      porcentajeMedico: dto.porcentajeMedico,
      porcentajeCentro: dto.porcentajeCentro,
      activo: dto.activo,
      details: dto.details,
      operatingCosts: dto.operatingCosts,
    });
    if (!updated) throw new NotFoundException('Package not found');
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id);
    return this.packageRepository.delete(id);
  }

  async sellPackage(packageId: string, terceroId?: string, medicoId?: string) {
    const pkg = await this.findById(packageId);
    if (!pkg.details || pkg.details.length === 0) {
      throw new BadRequestException('Package has no details');
    }

    if (medicoId) {
      const medico = await this.terceroRepository.findById(medicoId);
      if (!medico) throw new NotFoundException('Médico no encontrado');
      if (medico.tipoRelacion !== 'MEDICO') {
        throw new BadRequestException('El tercero debe ser de tipo MEDICO');
      }
    }

    // Calculate medication costs from current product costs
    let costoMedicamentos = 0;
    for (const detail of pkg.details) {
      const product = await this.productRepository.findById(detail.productId);
      if (!product) throw new NotFoundException(`Product ${detail.productId} not found`);
      if (product.stockActual < detail.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.nombre}. Available: ${product.stockActual}, requested: ${detail.quantity}`);
      }
      costoMedicamentos += product.costoCompra * detail.quantity;
    }

    // Calculate operating costs
    const costoOperativo = (pkg.operatingCosts || []).reduce((sum, oc) => sum + oc.valor, 0);

    const costoTotal = costoMedicamentos + costoOperativo;
    const utilidad = pkg.precio - costoTotal;
    const gananciaMedico = utilidad * (pkg.porcentajeMedico / 100);
    const gananciaCentro = utilidad * (pkg.porcentajeCentro / 100);

    // Discount inventory for each product
    for (const detail of pkg.details) {
      const product = await this.productRepository.findById(detail.productId);
      if (!product) throw new NotFoundException(`Product ${detail.productId} not found`);

      const stockBefore = product.stockActual;
      const stockAfter = stockBefore - detail.quantity;

      await this.productRepository.updateStock(detail.productId, -detail.quantity);

      await this.movementRepository.create({
        productId: detail.productId,
        movementType: 'EXIT',
        quantity: detail.quantity,
        stockBefore,
        stockAfter,
        referenceType: 'PACKAGE_SALE',
        referenceId: '',
      });
    }

    // Create sale with ONE detail for the package
    const maxCons = await this.saleRepository.findMaxConsecutivo();
    const consecutivo = maxCons + 1;

    const sale = await this.saleRepository.createWithDetails({
      consecutivo,
      terceroId,
      medicoId,
      total: pkg.precio,
      costoTotal,
      utilidadTotal: utilidad,
      gananciaMedico,
      gananciaCentro,
      details: [{
        productId: undefined,
        packageId: pkg.id,
        quantity: 1,
        unitPrice: pkg.precio,
        subTotal: pkg.precio,
      }],
    });

    // Create SalePackage snapshot with medicoId
    await this.salePackageRepository.create({
      saleId: sale.id,
      packageId: pkg.id,
      medicoId,
      precioVenta: pkg.precio,
      costoMedicamentos,
      costoOperativo,
      costoTotal,
      utilidad,
      porcentajeMedico: pkg.porcentajeMedico,
      porcentajeCentro: pkg.porcentajeCentro,
      gananciaMedico,
      gananciaCentro,
    });

    // Update movements with sale ID
    for (const detail of pkg.details) {
      const product = await this.productRepository.findById(detail.productId);
      if (product) {
        await this.movementRepository.create({
          productId: detail.productId,
          movementType: 'EXIT',
          quantity: detail.quantity,
          stockBefore: product.stockActual + detail.quantity,
          stockAfter: product.stockActual,
          referenceType: 'PACKAGE_SALE',
          referenceId: sale.id,
        });
      }
    }

    return {
      ...sale,
      packageProfitability: {
        costoMedicamentos,
        costoOperativo,
        costoTotal,
        utilidad,
        gananciaMedico,
        gananciaCentro,
      },
    };
  }

  async getPackageProfitability(packageId: string, startDate?: string, endDate?: string): Promise<{ sales: number; totalRevenue: number; totalCost: number; totalProfit: number; totalMedico: number; totalCentro: number }> {
    const salePackages = await this.salePackageRepository.findAll();
    const filtered = salePackages.filter(sp => {
      if (sp.packageId !== packageId) return false;
      if (startDate && new Date(sp.createdAt) < new Date(startDate)) return false;
      if (endDate && new Date(sp.createdAt) > new Date(endDate)) return false;
      return true;
    });

    return {
      sales: filtered.length,
      totalRevenue: filtered.reduce((s, sp) => s + sp.precioVenta, 0),
      totalCost: filtered.reduce((s, sp) => s + sp.costoTotal, 0),
      totalProfit: filtered.reduce((s, sp) => s + sp.utilidad, 0),
      totalMedico: filtered.reduce((s, sp) => s + sp.gananciaMedico, 0),
      totalCentro: filtered.reduce((s, sp) => s + sp.gananciaCentro, 0),
    };
  }
}

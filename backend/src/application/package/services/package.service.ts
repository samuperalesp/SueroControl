import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PACKAGE_REPOSITORY } from '../../../domain/package/interfaces/package.interface';
import type { IPackageRepository } from '../../../domain/package/interfaces/package.interface';
import { PRODUCT_REPOSITORY } from '../../../domain/product/interfaces/product.interface';
import type { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import type { IInventoryMovementRepository } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import { SALE_REPOSITORY } from '../../../domain/sale/interfaces/sale.interface';
import type { ISaleRepository } from '../../../domain/sale/interfaces/sale.interface';
import { Package } from '../../../domain/package/entities/package.entity';
import { CreatePackageDto, UpdatePackageDto } from '../dtos/package.dtos';

@Injectable()
export class PackageService {
  constructor(
    @Inject(PACKAGE_REPOSITORY) private readonly packageRepository: IPackageRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY) private readonly movementRepository: IInventoryMovementRepository,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
  ) {}

  async create(dto: CreatePackageDto): Promise<Package> {
    for (const detail of dto.details) {
      const product = await this.productRepository.findById(detail.productId);
      if (!product) throw new NotFoundException(`Product ${detail.productId} not found`);
    }
    return this.packageRepository.createWithDetails({
      nombre: dto.nombre,
      precio: dto.precio,
      activo: dto.activo ?? true,
      details: dto.details,
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
    const updated = await this.packageRepository.update(id, dto);
    if (!updated) throw new NotFoundException('Package not found');
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id);
    return this.packageRepository.delete(id);
  }

  async sellPackage(packageId: string, terceroId?: string) {
    const pkg = await this.findById(packageId);
    if (!pkg.details || pkg.details.length === 0) {
      throw new BadRequestException('Package has no details');
    }

    let total = pkg.precio;
    const detailEntries: { productId: string; packageId?: string; quantity: number; unitPrice: number; subTotal: number }[] = [];

    for (const detail of pkg.details) {
      const product = await this.productRepository.findById(detail.productId);
      if (!product) throw new NotFoundException(`Product ${detail.productId} not found`);
      if (product.stockActual < detail.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.nombre}. Available: ${product.stockActual}, requested: ${detail.quantity}`);
      }

      const stockBefore = product.stockActual;
      const stockAfter = stockBefore - detail.quantity;

      await this.productRepository.updateStock(detail.productId, -detail.quantity);

      const unitPrice = pkg.precio / pkg.details.length;
      detailEntries.push({
        productId: detail.productId,
        packageId: pkg.id,
        quantity: detail.quantity,
        unitPrice,
        subTotal: unitPrice * detail.quantity,
      });

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

    const maxCons = await this.saleRepository.findMaxConsecutivo();
    const consecutivo = maxCons + 1;

    const sale = await this.saleRepository.createWithDetails({
      consecutivo,
      terceroId,
      total,
      details: detailEntries,
    });

    for (const entry of detailEntries) {
      const product = await this.productRepository.findById(entry.productId);
      if (product) {
        await this.movementRepository.create({
          productId: entry.productId,
          movementType: 'EXIT',
          quantity: entry.quantity,
          stockBefore: product.stockActual + entry.quantity,
          stockAfter: product.stockActual,
          referenceType: 'PACKAGE_SALE',
          referenceId: sale.id,
        });
      }
    }

    return sale;
  }
}

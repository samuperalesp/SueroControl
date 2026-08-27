import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../../domain/product/interfaces/product.interface';
import type { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { WAREHOUSE_REPOSITORY } from '../../../domain/warehouse/interfaces/warehouse.interface';
import type { IWarehouseRepository } from '../../../domain/warehouse/interfaces/warehouse.interface';
import { WAREHOUSE_STOCK_REPOSITORY } from '../../../domain/warehouse-stock/interfaces/warehouse-stock.interface';
import type { IWarehouseStockRepository } from '../../../domain/warehouse-stock/interfaces/warehouse-stock.interface';
import { Product } from '../../../domain/product/entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '../dtos/product.dtos';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouseRepository: IWarehouseRepository,
    @Inject(WAREHOUSE_STOCK_REPOSITORY) private readonly warehouseStockRepository: IWarehouseStockRepository,
  ) {}

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const existingProduct = await this.productRepository.findByCodigo(createProductDto.codigo);
    if (existingProduct) {
      throw new BadRequestException(`Product with code ${createProductDto.codigo} already exists.`);
    }

    const { warehouseId, ...productFields } = createProductDto;
    const stock = createProductDto.stockActual || 0;
    const stockMinimo = createProductDto.stockMinimo || 0;

    let targetWarehouseId = warehouseId;
    let isPrincipalTarget = true;
    if (targetWarehouseId) {
      const warehouse = await this.warehouseRepository.findById(targetWarehouseId);
      if (!warehouse || !warehouse.activo) {
        throw new BadRequestException('Almacén no encontrado o inactivo');
      }
      isPrincipalTarget = warehouse.esPrincipal;
    } else {
      const principal = await this.warehouseRepository.findPrincipal();
      targetWarehouseId = principal?.id;
      isPrincipalTarget = !!principal;
    }

    const newProduct: Product = {
      id: uuidv4(),
      ...productFields,
      stockActual: isPrincipalTarget ? stock : 0,
      stockMinimo: isPrincipalTarget ? stockMinimo : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const created = await this.productRepository.create(newProduct);

    if (targetWarehouseId) {
      await this.warehouseStockRepository.setStock(targetWarehouseId, created.id, stock, stockMinimo);
    }

    return created;
  }

  async findAllProducts(warehouseId?: string): Promise<Product[]> {
    const products = await this.productRepository.findAll();
    if (!warehouseId) {
      return products;
    }
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse || !warehouse.activo) {
      throw new BadRequestException('Almacén no encontrado o inactivo');
    }
    const stocks = await this.warehouseStockRepository.findByWarehouse(warehouseId);
    const stockMap = new Map(stocks.map(s => [s.productId, s]));
    return products.map(p => {
      const st = stockMap.get(p.id);
      return st
        ? { ...p, stockActual: st.stock, stockMinimo: st.stockMinimo }
        : { ...p, stockActual: 0, stockMinimo: 0 };
    });
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (updateProductDto.codigo && updateProductDto.codigo !== existingProduct.codigo) {
      const productWithSameCode = await this.productRepository.findByCodigo(updateProductDto.codigo);
      if (productWithSameCode && productWithSameCode.id !== id) {
        throw new BadRequestException(`Product with code ${updateProductDto.codigo} already exists.`);
      }
    }

    const { warehouseId, ...productData } = updateProductDto;

    if (warehouseId && (updateProductDto.stockActual !== undefined || updateProductDto.stockMinimo !== undefined)) {
      const warehouse = await this.warehouseRepository.findById(warehouseId);
      if (!warehouse || !warehouse.activo) {
        throw new BadRequestException('Almacén no encontrado o inactivo');
      }

      const current = await this.warehouseStockRepository.findByWarehouseAndProduct(warehouseId, id);
      const newStock = updateProductDto.stockActual !== undefined ? updateProductDto.stockActual : (current?.stock ?? 0);
      const newMinimo = updateProductDto.stockMinimo !== undefined ? updateProductDto.stockMinimo : (current?.stockMinimo ?? 0);
      await this.warehouseStockRepository.setStock(warehouseId, id, newStock, newMinimo);

      if (warehouse.esPrincipal) {
        productData.stockActual = newStock;
        productData.stockMinimo = newMinimo;
      } else {
        delete productData.stockActual;
        delete productData.stockMinimo;
      }
    }

    const updatedProduct = await this.productRepository.update(id, productData);
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found after update attempt`);
    }
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const productExists = await this.productRepository.findById(id);
    if (!productExists) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.productRepository.delete(id);
  }

  async updateProductStock(id: string, quantity: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    const updatedProduct = await this.productRepository.updateStock(id, quantity);
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found after stock update attempt`);
    }
    return updatedProduct;
  }
}

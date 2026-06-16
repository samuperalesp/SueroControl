import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { Product } from '../../../domain/product/entities/product.entity';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ProductJsonRepository implements IProductRepository {
  private readonly dataFilePath = path.join(process.cwd(), '..', 'data', 'productos.json');

  constructor() {
    this.ensureFileExists();
  }

  private async ensureFileExists(): Promise<void> {
    try {
      await fs.access(this.dataFilePath);
    } catch {
      await fs.writeFile(this.dataFilePath, JSON.stringify([]), 'utf8');
    }
  }

  private async readProducts(): Promise<Product[]> {
    try {
      const data = await fs.readFile(this.dataFilePath, 'utf8');
      return JSON.parse(data) as Product[];
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await this.ensureFileExists();
        return [];
      }
      throw new InternalServerErrorException('Failed to read products data.');
    }
  }

  private async writeProducts(products: Product[]): Promise<void> {
    try {
      await fs.writeFile(this.dataFilePath, JSON.stringify(products, null, 2), 'utf8');
    } catch {
      throw new InternalServerErrorException('Failed to write products data.');
    }
  }

  async create(product: Product): Promise<Product> {
    const products = await this.readProducts();
    products.push(product);
    await this.writeProducts(products);
    return product;
  }

  async findAll(): Promise<Product[]> {
    return this.readProducts();
  }

  async findById(id: string): Promise<Product | undefined> {
    const products = await this.readProducts();
    return products.find(p => p.id === id);
  }

  async update(id: string, productUpdate: Partial<Product>): Promise<Product | undefined> {
    const products = await this.readProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      return undefined;
    }
    const updatedProduct = { ...products[index], ...productUpdate };
    products[index] = updatedProduct;
    await this.writeProducts(products);
    return updatedProduct;
  }

  async delete(id: string): Promise<boolean> {
    const products = await this.readProducts();
    const initialLength = products.length;
    const updatedProducts = products.filter(p => p.id !== id);
    if (updatedProducts.length === initialLength) {
      return false;
    }
    await this.writeProducts(updatedProducts);
    return true;
  }

  async findByCodigo(codigo: string): Promise<Product | undefined> {
    const products = await this.readProducts();
    return products.find(p => p.codigo === codigo);
  }

  async updateStock(id: string, quantity: number): Promise<Product | undefined> {
    const products = await this.readProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      return undefined;
    }
    const productToUpdate = products[index];
    productToUpdate.stockActual += quantity;

    if (productToUpdate.stockActual < 0) {
      throw new InternalServerErrorException('Stock cannot be negative.');
    }

    products[index] = productToUpdate;
    await this.writeProducts(products);
    return productToUpdate;
  }
}

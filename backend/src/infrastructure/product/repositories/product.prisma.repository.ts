import { Injectable } from '@nestjs/common';
import { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { Product } from '../../../domain/product/entities/product.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductPrismaRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(product: Product): Promise<Product> {
    const created = await this.prisma.product.create({ data: product });
    return created as Product;
  }

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } }) as Promise<Product[]>;
  }

  async findById(id: string): Promise<Product | undefined> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    return product ?? undefined;
  }

  async update(id: string, data: Partial<Product>): Promise<Product | undefined> {
    try {
      const updated = await this.prisma.product.update({ where: { id }, data });
      return updated as Product;
    } catch {
      return undefined;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.product.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async findByCodigo(codigo: string): Promise<Product | undefined> {
    const product = await this.prisma.product.findUnique({ where: { codigo } });
    return product ?? undefined;
  }

  async updateStock(id: string, quantity: number): Promise<Product | undefined> {
    try {
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product) return undefined;
      const newStock = product.stockActual + quantity;
      if (newStock < 0) throw new Error('Stock cannot be negative');
      const updated = await this.prisma.product.update({
        where: { id },
        data: { stockActual: newStock },
      });
      return updated as Product;
    } catch {
      return undefined;
    }
  }
}

import { Product } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

export interface IProductRepository {
  create(product: Product): Promise<Product>;
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | undefined>;
  update(id: string, product: Partial<Product>): Promise<Product | undefined>;
  delete(id: string): Promise<boolean>;
  findByCodigo(codigo: string): Promise<Product | undefined>;
  updateStock(id: string, quantity: number): Promise<Product | undefined>;
}

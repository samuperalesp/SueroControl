import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../../domain/product/interfaces/product.interface';
import type { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { Product } from '../../../domain/product/entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '../dtos/product.dtos';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductService {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository) {}

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const existingProduct = await this.productRepository.findByCodigo(createProductDto.codigo);
    if (existingProduct) {
      throw new BadRequestException(`Product with code ${createProductDto.codigo} already exists.`);
    }

    const newProduct: Product = {
      id: uuidv4(),
      ...createProductDto,
      stockActual: createProductDto.stockActual || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.productRepository.create(newProduct);
  }

  async findAllProducts(): Promise<Product[]> {
    return this.productRepository.findAll();
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

    const updatedProduct = await this.productRepository.update(id, updateProductDto);
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

import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductService } from '../../../application/product/services/product.service';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from '../../../application/product/dtos/product.dtos';
import { Product } from '../../../domain/product/entities/product.entity';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.productService.createProduct(createProductDto);
    return this.toResponseDto(product);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productService.findAllProducts();
    return products.map(p => this.toResponseDto(p));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productService.findProductById(id);
    return this.toResponseDto(product);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.productService.updateProduct(id, updateProductDto);
    return this.toResponseDto(product);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.productService.deleteProduct(id);
  }

  private toResponseDto(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.codigo = product.codigo;
    dto.nombre = product.nombre;
    dto.categoria = product.categoria;
    dto.descripcion = product.descripcion;
    dto.costoCompra = product.costoCompra;
    dto.precioVenta = product.precioVenta;
    dto.stockActual = product.stockActual;
    dto.stockMinimo = product.stockMinimo;
    dto.activo = product.activo;
    return dto;
  }
}

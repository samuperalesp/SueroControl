import { Module } from '@nestjs/common';
import { ProductController } from './presentation/product/controllers/product.controller';
import { ProductService } from './application/product/services/product.service';
import { ProductPrismaRepository } from './infrastructure/product/repositories/product.prisma.repository';
import { PRODUCT_REPOSITORY } from './domain/product/interfaces/product.interface';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductPrismaRepository,
    },
  ],
  exports: [ProductService],
})
export class ProductModule {}

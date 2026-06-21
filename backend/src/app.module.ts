import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { ProductModule } from './product.module';
import { TerceroModule } from './tercero.module';
import { PurchaseModule } from './purchase.module';
import { SaleModule } from './sale.module';
import { PackageModule } from './package.module';
import { InventoryMovementModule } from './inventory-movement.module';

@Module({
  imports: [
    PrismaModule,
    ProductModule,
    TerceroModule,
    PurchaseModule,
    SaleModule,
    PackageModule,
    InventoryMovementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

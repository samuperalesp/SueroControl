import { Module } from '@nestjs/common';
import { TerceroController } from './presentation/tercero/controllers/tercero.controller';
import { TerceroService } from './application/tercero/services/tercero.service';
import { TerceroPrismaRepository } from './infrastructure/tercero/repositories/tercero.prisma.repository';
import { TERCERO_REPOSITORY } from './domain/tercero/interfaces/tercero.interface';

@Module({
  controllers: [TerceroController],
  providers: [
    TerceroService,
    {
      provide: TERCERO_REPOSITORY,
      useClass: TerceroPrismaRepository,
    },
  ],
  exports: [TerceroService],
})
export class TerceroModule {}

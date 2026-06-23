import { Injectable } from '@nestjs/common';
import type { ISaleHistoryRepository, SaleHistoryData } from '../../../domain/sale/interfaces/sale.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SaleHistoryPrismaRepository implements ISaleHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: SaleHistoryData): Promise<void> {
    await this.prisma.saleHistory.create({
      data: {
        saleId: data.saleId,
        campo: data.campo,
        valorAnterior: data.valorAnterior,
        valorNuevo: data.valorNuevo,
        userId: data.userId,
      },
    });
  }

  async findBySaleId(saleId: string): Promise<SaleHistoryData[]> {
    const records = await this.prisma.saleHistory.findMany({
      where: { saleId },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(r => ({
      saleId: r.saleId,
      campo: r.campo,
      valorAnterior: r.valorAnterior ?? undefined,
      valorNuevo: r.valorNuevo ?? undefined,
      userId: r.userId ?? undefined,
    }));
  }
}

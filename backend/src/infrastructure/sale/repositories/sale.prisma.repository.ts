import { Injectable } from '@nestjs/common';
import { ISaleRepository } from '../../../domain/sale/interfaces/sale.interface';
import type { SaleSearchParams, SaleDetailData } from '../../../domain/sale/interfaces/sale.interface';
import { Sale } from '../../../domain/sale/entities/sale.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalePrismaRepository implements ISaleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private include = { details: true };

  async createWithDetails(data: {
    consecutivo: number;
    terceroId?: string;
    medicoId?: string;
    total: number;
    costoTotal?: number;
    utilidadTotal?: number;
    gananciaMedico?: number;
    gananciaCentro?: number;
    details: SaleDetailData[];
  }): Promise<Sale> {
    const created = await this.prisma.sale.create({
      data: {
        consecutivo: data.consecutivo,
        terceroId: data.terceroId,
        medicoId: data.medicoId,
        total: data.total,
        costoTotal: data.costoTotal,
        utilidadTotal: data.utilidadTotal,
        gananciaMedico: data.gananciaMedico,
        gananciaCentro: data.gananciaCentro,
        details: { create: data.details },
      },
      include: this.include,
    });
    return created as unknown as Sale;
  }

  async findAll(params?: SaleSearchParams): Promise<Sale[]> {
    const where: any = {};
    if (params) {
      if (params.consecutivo) where.consecutivo = params.consecutivo;
      if (params.terceroId) where.terceroId = params.terceroId;
      if (params.fechaDesde || params.fechaHasta) {
        where.createdAt = {};
        if (params.fechaDesde) where.createdAt.gte = new Date(params.fechaDesde);
        if (params.fechaHasta) where.createdAt.lte = new Date(params.fechaHasta);
      }
    }
    return this.prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: this.include,
    }) as Promise<Sale[]>;
  }

  async findById(id: string): Promise<Sale | null> {
    return this.prisma.sale.findUnique({
      where: { id },
      include: this.include,
    }) as Promise<Sale | null>;
  }

  async findByConsecutivo(consecutivo: number): Promise<Sale | null> {
    return this.prisma.sale.findFirst({
      where: { consecutivo },
      include: this.include,
    }) as Promise<Sale | null>;
  }

  async findMaxConsecutivo(): Promise<number> {
    const result = await this.prisma.sale.aggregate({
      _max: { consecutivo: true },
    });
    return result._max.consecutivo ?? 0;
  }

  async update(id: string, data: { terceroId?: string; total?: number; details?: SaleDetailData[] }): Promise<Sale> {
    const updateData: any = {};
    if (data.terceroId !== undefined) updateData.terceroId = data.terceroId;
    if (data.total !== undefined) updateData.total = data.total;

    if (data.details) {
      await this.prisma.saleDetail.deleteMany({ where: { saleId: id } });
      const updated = await this.prisma.sale.update({
        where: { id },
        data: {
          ...updateData,
          details: { create: data.details },
        },
        include: this.include,
      });
      return updated as unknown as Sale;
    }

    const updated = await this.prisma.sale.update({
      where: { id },
      data: updateData,
      include: this.include,
    });
    return updated as unknown as Sale;
  }

  async cancel(id: string, motivo: string): Promise<Sale> {
    const updated = await this.prisma.sale.update({
      where: { id },
      data: {
        estado: 'ANULADA',
        anuladaMotivo: motivo,
        anuladaAt: new Date(),
      },
      include: this.include,
    });
    return updated as unknown as Sale;
  }
}

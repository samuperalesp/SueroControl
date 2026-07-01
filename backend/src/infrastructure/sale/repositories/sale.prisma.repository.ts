import { Injectable } from '@nestjs/common';
import { ISaleRepository } from '../../../domain/sale/interfaces/sale.interface';
import type { SaleSearchParams, SaleDetailData, UpdateSaleData } from '../../../domain/sale/interfaces/sale.interface';
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
    fechaVenta?: Date;
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
        fechaVenta: data.fechaVenta ?? new Date(),
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
        where.fechaVenta = {};
        if (params.fechaDesde) where.fechaVenta.gte = new Date(params.fechaDesde);
        if (params.fechaHasta) where.fechaVenta.lte = new Date(params.fechaHasta);
      }
    }
    return this.prisma.sale.findMany({
      where,
      orderBy: { fechaVenta: { sort: 'desc', nulls: 'last' } },
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

  async update(id: string, data: UpdateSaleData): Promise<Sale> {
    const updateData: any = {};
    if (data.terceroId !== undefined) updateData.terceroId = data.terceroId;
    if (data.medicoId !== undefined) updateData.medicoId = data.medicoId;
    if (data.total !== undefined) updateData.total = data.total;
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.fechaVenta !== undefined) updateData.fechaVenta = data.fechaVenta;

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

import { Injectable } from '@nestjs/common';
import { IPurchaseRepository } from '../../../domain/purchase/interfaces/purchase.interface';
import { Purchase } from '../../../domain/purchase/entities/purchase.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PurchasePrismaRepository implements IPurchaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithDetails(data: {
    tipo?: string;
    pedidoId?: string;
    facturaNumero?: string;
    terceroId?: string;
    total: number;
    details: { productId: string; quantity: number; unitCost: number; subTotal: number }[];
  }): Promise<Purchase> {
    const created = await this.prisma.purchase.create({
      data: {
        tipo: data.tipo ?? 'COMPRA',
        pedidoId: data.pedidoId,
        facturaNumero: data.facturaNumero,
        terceroId: data.terceroId,
        total: data.total,
        details: {
          create: data.details,
        },
      },
      include: { details: true },
    });
    return created as unknown as Purchase;
  }

  async findAll(): Promise<Purchase[]> {
    return this.prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      include: { details: true },
    }) as Promise<Purchase[]>;
  }

  async findById(id: string): Promise<Purchase | null> {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: { details: true },
    }) as Promise<Purchase | null>;
  }

  async update(id: string, data: { tipo?: string; pedidoId?: string; total?: number }): Promise<Purchase | null> {
    try {
      return this.prisma.purchase.update({
        where: { id },
        data,
        include: { details: true },
      }) as Promise<Purchase>;
    } catch {
      return null;
    }
  }
}

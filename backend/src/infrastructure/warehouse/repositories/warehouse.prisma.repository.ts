import { Injectable } from '@nestjs/common';
import { IWarehouseRepository } from '../../../domain/warehouse/interfaces/warehouse.interface';
import { Warehouse } from '../../../domain/warehouse/entities/warehouse.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WarehousePrismaRepository implements IWarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Warehouse | undefined> {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    return warehouse ?? undefined;
  }

  async findPrincipal(): Promise<Warehouse | undefined> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { esPrincipal: true, activo: true },
    });
    return warehouse ?? undefined;
  }

  async findActive(): Promise<Warehouse[]> {
    return this.prisma.warehouse.findMany({
      where: { activo: true },
      orderBy: { createdAt: 'asc' },
    }) as Promise<Warehouse[]>;
  }

  async findAll(): Promise<Warehouse[]> {
    return this.prisma.warehouse.findMany({
      orderBy: { createdAt: 'asc' },
    }) as Promise<Warehouse[]>;
  }

  async create(data: { nombre: string; esPrincipal?: boolean; activo?: boolean }): Promise<Warehouse> {
    const created = await this.prisma.warehouse.create({
      data: {
        nombre: data.nombre,
        esPrincipal: data.esPrincipal ?? false,
        activo: data.activo ?? true,
      },
    });
    return created as Warehouse;
  }

  async update(id: string, data: { nombre?: string; esPrincipal?: boolean; activo?: boolean }): Promise<Warehouse | undefined> {
    try {
      const updated = await this.prisma.warehouse.update({ where: { id }, data });
      return updated as Warehouse;
    } catch {
      return undefined;
    }
  }
}

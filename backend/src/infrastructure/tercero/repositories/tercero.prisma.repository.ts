import { Injectable } from '@nestjs/common';
import { ITerceroRepository } from '../../../domain/tercero/interfaces/tercero.interface';
import { Tercero } from '../../../domain/tercero/entities/tercero.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TerceroPrismaRepository implements ITerceroRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Tercero): Promise<Tercero> {
    const created = await this.prisma.tercero.create({ data });
    return created as Tercero;
  }

  async findAll(): Promise<Tercero[]> {
    return this.prisma.tercero.findMany({ orderBy: { createdAt: 'desc' } }) as Promise<Tercero[]>;
  }

  async findById(id: string): Promise<Tercero | null> {
    return this.prisma.tercero.findUnique({ where: { id } }) as Promise<Tercero | null>;
  }

  async findByDocumento(tipoDocumento: string, numero: string): Promise<Tercero | null> {
    return this.prisma.tercero.findFirst({
      where: { tipoDocumento, numeroDocumento: numero },
    }) as Promise<Tercero | null>;
  }

  async update(id: string, data: Partial<Tercero>): Promise<Tercero | null> {
    try {
      return this.prisma.tercero.update({ where: { id }, data }) as Promise<Tercero>;
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.tercero.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

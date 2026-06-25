import { Injectable } from '@nestjs/common';
import { IPackageSessionRepository, CreatePackageSessionData } from '../../../domain/package-session/interfaces/package-session.interface';
import { PackageSession } from '../../../domain/package-session/entities/package-session.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackageSessionPrismaRepository implements IPackageSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePackageSessionData): Promise<PackageSession> {
    const created = await this.prisma.packageSession.create({
      data: {
        saleId: data.saleId,
        patientId: data.patientId ?? null,
        medicoId: data.medicoId,
        packageId: data.packageId,
        cantidadSesiones: data.cantidadSesiones,
        sesionesConsumidas: 0,
        sesionesPendientes: data.cantidadSesiones,
        precioUnitario: data.precioUnitario,
        subtotal: data.subtotal,
        descuentoPorcentaje: data.descuentoPorcentaje,
        descuentoValor: data.descuentoValor,
        totalPagado: data.totalPagado,
        estado: 'ACTIVA',
        fechaInicio: new Date(),
        fechaVencimiento: data.fechaVencimiento,
      },
    });
    return created as unknown as PackageSession;
  }

  async findAll(): Promise<PackageSession[]> {
    return this.prisma.packageSession.findMany({
      include: {
        sale: true,
        patient: true,
        medico: true,
        package: true,
        applications: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<PackageSession[]>;
  }

  async findById(id: string): Promise<PackageSession | null> {
    return this.prisma.packageSession.findUnique({
      where: { id },
      include: {
        sale: true,
        patient: true,
        medico: true,
        package: {
          include: {
            details: true,
            operatingCosts: true,
          },
        },
        applications: true,
      },
    }) as Promise<PackageSession | null>;
  }

  async updateSesiones(id: string, sesionesConsumidas: number, sesionesPendientes: number, estado: string): Promise<PackageSession> {
    const updated = await this.prisma.packageSession.update({
      where: { id },
      data: { sesionesConsumidas, sesionesPendientes, estado },
    });
    return updated as unknown as PackageSession;
  }

  async cancel(id: string): Promise<PackageSession> {
    const updated = await this.prisma.packageSession.update({
      where: { id },
      data: { estado: 'CANCELADA' },
    });
    return updated as unknown as PackageSession;
  }
}

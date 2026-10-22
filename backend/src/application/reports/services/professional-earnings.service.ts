import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ProfessionalEarningsQueryDto } from '../dtos/professional-earnings.dtos';

type TerceroNombre =
  | {
      nombres?: string | null;
      apellidos?: string | null;
      razonSocial?: string | null;
      tipoPersona?: string | null;
    }
  | null
  | undefined;

@Injectable()
export class ProfessionalEarningsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(params: ProfessionalEarningsQueryDto = {}) {
    const { warehouseId, medicoId } = params;
    const dateRange = this.buildDateRange(params.fromDate, params.toDate);

    if (warehouseId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: warehouseId, activo: true },
      });
      if (!warehouse) {
        throw new BadRequestException('Almacén no encontrado o inactivo');
      }
    }

    const where: Prisma.SalePackageWhereInput = {
      sale: {
        estado: 'ACTIVA',
        ...(warehouseId ? { warehouseId } : {}),
      },
    };
    if (medicoId) where.medicoId = medicoId;
    if (dateRange) where.createdAt = dateRange;

    const grouped = await this.prisma.salePackage.groupBy({
      by: ['medicoId'],
      where,
      _count: { _all: true },
      _sum: {
        precioVenta: true,
        costoMedicamentos: true,
        costoOperativo: true,
        costoTotal: true,
        utilidad: true,
        gananciaMedico: true,
        gananciaCentro: true,
      },
    });

    const medicoIds = grouped
      .map((g) => g.medicoId)
      .filter((id): id is string => !!id);

    const medicos = medicoIds.length
      ? await this.prisma.tercero.findMany({
          where: { id: { in: medicoIds } },
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            razonSocial: true,
            tipoPersona: true,
          },
        })
      : [];
    const medicoMap = new Map(medicos.map((m) => [m.id, m]));

    const summary = grouped
      .map((g) => {
        const medico = g.medicoId ? medicoMap.get(g.medicoId) : null;
        return {
          medicoId: g.medicoId,
          profesional: this.formatTercero(medico) ?? 'Sin profesional',
          operaciones: g._count._all,
          ventas: this.round(g._sum.precioVenta),
          costoMedicamentos: this.round(g._sum.costoMedicamentos),
          costoOperativo: this.round(g._sum.costoOperativo),
          costoTotal: this.round(g._sum.costoTotal),
          utilidad: this.round(g._sum.utilidad),
          gananciaProfesional: this.round(g._sum.gananciaMedico),
          gananciaCentro: this.round(g._sum.gananciaCentro),
        };
      })
      .sort((a, b) => b.gananciaProfesional - a.gananciaProfesional);

    const salePackages = await this.prisma.salePackage.findMany({
      where,
      orderBy: [{ sale: { consecutivo: 'asc' } }, { createdAt: 'asc' }],
      include: {
        package: { select: { nombre: true } },
        medico: {
          select: {
            nombres: true,
            apellidos: true,
            razonSocial: true,
            tipoPersona: true,
          },
        },
        sale: {
          select: {
            consecutivo: true,
            fechaVenta: true,
            tercero: {
              select: {
                nombres: true,
                apellidos: true,
                razonSocial: true,
                tipoPersona: true,
              },
            },
            warehouse: { select: { nombre: true } },
          },
        },
        sessionApplications: {
          select: {
            sesionNumero: true,
            fechaAplicacion: true,
            packageSession: { select: { cantidadSesiones: true } },
          },
        },
      },
    });

    const detail = salePackages.map((sp) => {
      const application = sp.sessionApplications[0];
      const esSesion = !!application;
      const fecha = application?.fechaAplicacion ?? sp.createdAt;
      return {
        salePackageId: sp.id,
        fecha: fecha.toISOString(),
        tipoOperacion: esSesion ? 'Sesión de paquete' : 'Venta de paquete',
        consecutivo: sp.sale.consecutivo,
        comprobante: `FV-${String(sp.sale.consecutivo).padStart(6, '0')}`,
        paciente: this.formatTercero(sp.sale.tercero),
        paquete: sp.package?.nombre ?? null,
        medicoId: sp.medicoId,
        profesional: this.formatTercero(sp.medico) ?? 'Sin profesional',
        valorVenta: this.round(sp.precioVenta),
        costoMedicamentos: this.round(sp.costoMedicamentos),
        costoOperativo: this.round(sp.costoOperativo),
        costoTotal: this.round(sp.costoTotal),
        utilidad: this.round(sp.utilidad),
        porcentajeProfesional: sp.porcentajeMedico,
        gananciaProfesional: this.round(sp.gananciaMedico),
        porcentajeCentro: sp.porcentajeCentro,
        gananciaCentro: this.round(sp.gananciaCentro),
        almacen: sp.sale.warehouse?.nombre ?? null,
        sesionNumero: application?.sesionNumero ?? null,
        sesionesTotales: application?.packageSession?.cantidadSesiones ?? null,
      };
    });

    const totals = {
      operaciones: detail.length,
      ventas: this.round(detail.reduce((sum, d) => sum + d.valorVenta, 0)),
      costoMedicamentos: this.round(
        detail.reduce((sum, d) => sum + d.costoMedicamentos, 0),
      ),
      costoOperativo: this.round(
        detail.reduce((sum, d) => sum + d.costoOperativo, 0),
      ),
      costoTotal: this.round(detail.reduce((sum, d) => sum + d.costoTotal, 0)),
      utilidad: this.round(detail.reduce((sum, d) => sum + d.utilidad, 0)),
      gananciaProfesional: this.round(
        detail.reduce((sum, d) => sum + d.gananciaProfesional, 0),
      ),
      gananciaCentro: this.round(
        detail.reduce((sum, d) => sum + d.gananciaCentro, 0),
      ),
    };

    return {
      filters: {
        fromDate: params.fromDate ?? null,
        toDate: params.toDate ?? null,
        warehouseId: warehouseId ?? null,
        medicoId: medicoId ?? null,
      },
      summary,
      detail,
      totals,
    };
  }

  private buildDateRange(
    fromDate?: string,
    toDate?: string,
  ): { gte?: Date; lte?: Date } | undefined {
    if (!fromDate && !toDate) return undefined;

    const from = fromDate
      ? new Date(`${fromDate.slice(0, 10)}T00:00:00.000`)
      : undefined;
    const to = toDate
      ? new Date(`${toDate.slice(0, 10)}T23:59:59.999`)
      : undefined;

    if ((from && isNaN(from.getTime())) || (to && isNaN(to.getTime()))) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException(
        'La fecha "desde" no puede ser mayor que la fecha "hasta"',
      );
    }

    return {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  private formatTercero(tercero: TerceroNombre): string | null {
    if (!tercero) return null;
    if (tercero.tipoPersona === 'JURIDICA') {
      return tercero.razonSocial?.trim() || null;
    }
    const nombre = `${tercero.nombres ?? ''} ${tercero.apellidos ?? ''}`.trim();
    return nombre || tercero.razonSocial?.trim() || null;
  }

  private round(value: number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return Math.round(value * 100) / 100;
  }
}

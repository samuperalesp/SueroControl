import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const sales = await this.prisma.sale.findMany({
      where: { estado: 'ACTIVA' },
      include: {
        details: true,
        salePackages: true,
      },
    });

    const ventasTotales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalSales = sales.length;
    const totalPackagesSold = sales.reduce((sum, s) => sum + (s.salePackages?.length ?? 0), 0);

    const compras = await this.prisma.purchase.findMany({
      where: { tipo: 'COMPRA' },
    });
    const comprasTotales = compras.reduce((sum, c) => sum + c.total, 0);

    const salePackages = await this.prisma.salePackage.findMany({
      where: {
        sale: { estado: 'ACTIVA' },
      },
      include: {
        medico: true,
      },
    });

    const gananciaCentro = salePackages.reduce((sum, sp) => sum + sp.gananciaCentro, 0);
    const utilidadTotal = salePackages.reduce((sum, sp) => sum + sp.utilidad, 0);

    const medicoMap = new Map<string, { nombre: string; total: number }>();
    for (const sp of salePackages) {
      if (!sp.medicoId) continue;
      const existing = medicoMap.get(sp.medicoId) || {
        nombre: sp.medico
          ? `${sp.medico.nombres || ''} ${sp.medico.apellidos || ''}`.trim()
          : 'Médico',
        total: 0,
      };
      existing.total += sp.gananciaMedico;
      medicoMap.set(sp.medicoId, existing);
    }

    const topMedicos = Array.from(medicoMap.entries())
      .map(([id, data]) => ({ id, nombre: data.nombre, total: Math.round(data.total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);

    return {
      ventasTotales: Math.round(ventasTotales * 100) / 100,
      comprasTotales: Math.round(comprasTotales * 100) / 100,
      gananciaCentro: Math.round(gananciaCentro * 100) / 100,
      utilidadTotal: Math.round(utilidadTotal * 100) / 100,
      totalSales,
      totalPackagesSold,
      topMedicos,
    };
  }
}

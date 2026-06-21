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
    const costosTotales = sales.reduce((sum, s) => sum + (s.costoTotal ?? 0), 0);
    const gananciaMedicos = sales.reduce((sum, s) => sum + (s.gananciaMedico ?? 0), 0);
    const gananciaCentro = sales.reduce((sum, s) => sum + (s.gananciaCentro ?? 0), 0);

    const totalSales = sales.length;
    const totalPackagesSold = sales.reduce((sum, s) => sum + (s.salePackages?.length ?? 0), 0);

    return {
      ventasTotales: Math.round(ventasTotales * 100) / 100,
      costosTotales: Math.round(costosTotales * 100) / 100,
      gananciaMedicos: Math.round(gananciaMedicos * 100) / 100,
      gananciaCentro: Math.round(gananciaCentro * 100) / 100,
      utilidadTotal: Math.round((ventasTotales - costosTotales) * 100) / 100,
      totalSales,
      totalPackagesSold,
    };
  }
}

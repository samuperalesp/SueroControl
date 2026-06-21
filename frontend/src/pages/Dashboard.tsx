import { useState, useEffect } from 'react';
import { fetchDashboard } from '../api/dashboardApi';
import type { DashboardSummary } from '../api/dashboardApi';

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchDashboard();
        setData(result);
      } catch (e) {
        setError('Error al cargar datos del dashboard');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-20">
        <p className="text-gray-400">Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-20">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Ventas Totales',
      value: formatCOP(data?.ventasTotales || 0),
      subtitle: `${data?.totalSales || 0} ventas realizadas`,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Costos Totales',
      value: formatCOP(data?.costosTotales || 0),
      subtitle: 'Costo de medicamentos e insumos',
      color: 'bg-orange-50 text-orange-700',
    },
    {
      title: 'Ganancia Médicos',
      value: formatCOP(data?.gananciaMedicos || 0),
      subtitle: 'Utilidad distribuida a médicos',
      color: 'bg-green-50 text-green-700',
    },
    {
      title: 'Ganancia Centro',
      value: formatCOP(data?.gananciaCentro || 0),
      subtitle: 'Utilidad distribuida al centro',
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel de Control</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{card.title}</p>
            <p className={`text-2xl font-bold ${card.color.split(' ')[1]}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-2">{card.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de Rentabilidad</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Utilidad Total</span>
              <span className="font-bold text-gray-800">{formatCOP(data?.utilidadTotal || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Distribución a Médicos</span>
              <span className="font-medium text-green-600">{formatCOP(data?.gananciaMedicos || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Distribución al Centro</span>
              <span className="font-medium text-purple-600">{formatCOP(data?.gananciaCentro || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Paquetes Vendidos</span>
              <span className="font-medium text-gray-800">{data?.totalPackagesSold || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Información del Sistema</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Estado</span>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Operativo
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Base de Datos</span>
              <span className="text-gray-700">PostgreSQL</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Versión</span>
              <span className="text-gray-700">v3.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

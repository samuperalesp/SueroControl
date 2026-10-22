import { useState, useEffect, type ComponentType, type SVGProps } from 'react';
import { fetchDashboard } from '../api/dashboardApi';
import type { DashboardSummary } from '../api/dashboardApi';
import { useWarehouse } from '../context/WarehouseContext';
import {
  PurchasesIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  WalletIcon,
} from '../components/Icons';

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface SummaryCard {
  title: string;
  value: string;
  subtitle: string;
  icon: IconComponent;
  iconClass: string;
}

export default function Dashboard() {
  const { selectedWarehouseId, selectedWarehouse } = useWarehouse();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterError, setFilterError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>(undefined);
  const [appliedTo, setAppliedTo] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const result = await fetchDashboard(selectedWarehouseId ?? undefined, appliedFrom, appliedTo);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError('Error al cargar datos del dashboard');
          console.error(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedWarehouseId, appliedFrom, appliedTo]);

  function handleApply() {
    if (fromDate && toDate && new Date(fromDate).getTime() > new Date(toDate).getTime()) {
      setFilterError('La fecha "Desde" no puede ser mayor que la fecha "Hasta"');
      return;
    }
    setFilterError('');
    setAppliedFrom(fromDate || undefined);
    setAppliedTo(toDate || undefined);
  }

  function handleClear() {
    setFromDate('');
    setToDate('');
    setAppliedFrom(undefined);
    setAppliedTo(undefined);
    setFilterError('');
  }

  const cards: SummaryCard[] = [
    {
      title: 'Ventas Totales',
      value: formatCOP(data?.ventasTotales || 0),
      subtitle: `${data?.totalSales || 0} ventas realizadas`,
      icon: WalletIcon,
      iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    },
    {
      title: 'Compras Totales',
      value: formatCOP(data?.comprasTotales || 0),
      subtitle: 'Compras realizadas',
      icon: PurchasesIcon,
      iconClass: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
    },
    {
      title: 'Ganancia Centro',
      value: formatCOP(data?.gananciaCentro || 0),
      subtitle: 'Utilidad distribuida al centro',
      icon: TrendingUpIcon,
      iconClass: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    },
    {
      title: 'Top Médicos',
      value: `${data?.topMedicos?.length || 0} médicos`,
      subtitle: 'Médicos con mayor utilidad',
      icon: StethoscopeIcon,
      iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="sc-page-title">Panel de Control</h2>
          <p className="sc-page-subtitle">
            {selectedWarehouse
              ? `Vista general de ${selectedWarehouse.nombre}`
              : 'Vista general de la operación'}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Datos en tiempo real
        </span>
      </div>

      {/* Filtros */}
      <div className="sc-card mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Desde
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hasta
            </label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleApply}
            className="h-10 cursor-pointer rounded-xl bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Aplicar
          </button>
          <button
            onClick={handleClear}
            className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Limpiar filtros
          </button>
        </div>
        {filterError && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{filterError}</p>}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
          <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">Cargando dashboard...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-16 dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(card => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="sc-card sc-card-hover p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {card.title}
                      </p>
                      <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        {card.value}
                      </p>
                    </div>
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${card.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    {card.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="sc-card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Resumen de Rentabilidad
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Periodo
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between border-b border-slate-100 py-3 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Utilidad Total</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCOP(data?.utilidadTotal || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-3 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Distribución al Centro</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {formatCOP(data?.gananciaCentro || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-slate-500 dark:text-slate-400">Paquetes Vendidos</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {data?.totalPackagesSold || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="sc-card p-5 sm:p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Top Médicos por Utilidad
              </h3>
              {data?.topMedicos && data.topMedicos.length > 0 ? (
                <div className="space-y-1">
                  {data.topMedicos.slice(0, 5).map((medico, idx) => (
                    <div
                      key={medico.id}
                      className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
                            idx === 0
                              ? 'bg-amber-500'
                              : idx === 1
                                ? 'bg-slate-400'
                                : idx === 2
                                  ? 'bg-amber-700'
                                  : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate text-sm text-slate-700 dark:text-slate-300">
                          {medico.nombre}
                        </span>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCOP(medico.total)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                  No hay datos de médicos disponibles.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

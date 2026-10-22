import { useState, useEffect, useMemo, Fragment } from 'react';
import { fetchProfessionalEarnings } from '../api/reportsApi';
import type { ProfessionalEarningsReport, ProfessionalEarningsDetailRow } from '../api/reportsApi';
import { fetchTerceros } from '../api/terceroApi';
import type { Tercero } from '../types/tercero';
import { useWarehouse } from '../context/WarehouseContext';

const SIN_PROFESIONAL = 'SIN_PROFESIONAL';

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return value.split('T')[0];
}

function nombreTercero(t: Tercero): string {
  return t.tipoPersona === 'NATURAL'
    ? `${t.nombres ?? ''} ${t.apellidos ?? ''}`.trim()
    : t.razonSocial ?? '';
}

interface AppliedFilters {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  medicoId?: string;
}

export default function Reports() {
  const { warehouses } = useWarehouse();
  const [medicos, setMedicos] = useState<Tercero[]>([]);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [medicoId, setMedicoId] = useState('');

  const [applied, setApplied] = useState<AppliedFilters>({});
  const [report, setReport] = useState<ProfessionalEarningsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterError, setFilterError] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTerceros()
      .then(data => setMedicos(data.filter(t => t.tipoRelacion === 'MEDICO')))
      .catch(() => setMedicos([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const result = await fetchProfessionalEarnings(applied);
        if (!cancelled) setReport(result);
      } catch (e) {
        if (!cancelled) {
          setError('Error al cargar el reporte de ganancias por profesional');
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
  }, [applied]);

  function handleConsultar() {
    if (fromDate && toDate && new Date(fromDate).getTime() > new Date(toDate).getTime()) {
      setFilterError('La fecha "Desde" no puede ser mayor que la fecha "Hasta"');
      return;
    }
    setFilterError('');
    setExpanded(new Set());
    setApplied({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      warehouseId: warehouseId || undefined,
      medicoId: medicoId || undefined,
    });
  }

  function handleLimpiar() {
    setFromDate('');
    setToDate('');
    setWarehouseId('');
    setMedicoId('');
    setFilterError('');
    setExpanded(new Set());
    setApplied({});
  }

  function toggle(key: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const detailByProfesional = useMemo(() => {
    const map = new Map<string, ProfessionalEarningsDetailRow[]>();
    if (report) {
      for (const d of report.detail) {
        const key = d.medicoId ?? SIN_PROFESIONAL;
        const list = map.get(key);
        if (list) list.push(d);
        else map.set(key, [d]);
      }
    }
    return map;
  }, [report]);

  const totals = report?.totals;

  const cards = [
    { title: 'Operaciones', value: String(totals?.operaciones ?? 0), color: 'text-slate-800 dark:text-slate-100' },
    { title: 'Ventas', value: formatCOP(totals?.ventas ?? 0), color: 'text-blue-700 dark:text-blue-400' },
    { title: 'Utilidad', value: formatCOP(totals?.utilidad ?? 0), color: 'text-slate-800 dark:text-slate-100' },
    { title: 'Ganancia profesionales', value: formatCOP(totals?.gananciaProfesional ?? 0), color: 'text-green-700 dark:text-emerald-400' },
    { title: 'Ganancia centro', value: formatCOP(totals?.gananciaCentro ?? 0), color: 'text-purple-700 dark:text-purple-400' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="sc-page-title">Reportes</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ganancias por profesional</p>
      </div>

      <div className="sc-card p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Almacén</label>
            <select
              value={warehouseId}
              onChange={e => setWarehouseId(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Todos los almacenes</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Profesional</label>
            <select
              value={medicoId}
              onChange={e => setMedicoId(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-400 max-w-60"
            >
              <option value="">Todos los profesionales</option>
              {medicos.map(m => (
                <option key={m.id} value={m.id}>{nombreTercero(m)}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleConsultar}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-blue-500 text-sm font-medium hover:bg-slate-800 dark:hover:bg-blue-400 cursor-pointer"
          >
            Consultar
          </button>
          <button
            onClick={handleLimpiar}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
        {filterError && <p className="text-red-500 dark:text-red-400 text-xs mt-2">{filterError}</p>}
      </div>

      {loading ? (
        <div className="text-center mt-20">
          <p className="text-slate-400 dark:text-slate-500">Cargando reporte...</p>
        </div>
      ) : error ? (
        <div className="text-center mt-20">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      ) : !report || report.summary.length === 0 ? (
        <div className="sc-card p-8 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">No hay información para los filtros seleccionados.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {cards.map(card => (
              <div key={card.title} className="sc-card p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{card.title}</p>
                <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Resumen</h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 mb-8">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Profesional</th>
                  <th className="px-4 py-3 font-medium text-right">Operaciones</th>
                  <th className="px-4 py-3 font-medium text-right">Ventas</th>
                  <th className="px-4 py-3 font-medium text-right">Costo medicamentos</th>
                  <th className="px-4 py-3 font-medium text-right">Costo operativo</th>
                  <th className="px-4 py-3 font-medium text-right">Utilidad</th>
                  <th className="px-4 py-3 font-medium text-right">Ganancia profesional</th>
                  <th className="px-4 py-3 font-medium text-right">Ganancia centro</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.summary.map(row => {
                  const key = row.medicoId ?? SIN_PROFESIONAL;
                  const isOpen = expanded.has(key);
                  const rows = detailByProfesional.get(key) ?? [];
                  return (
                    <Fragment key={key}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">{row.profesional}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-right">{row.operaciones}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200 text-right">{formatCOP(row.ventas)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-right">{formatCOP(row.costoMedicamentos)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-right">{formatCOP(row.costoOperativo)}</td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-100 text-right font-medium">{formatCOP(row.utilidad)}</td>
                        <td className="px-4 py-3 text-green-700 dark:text-emerald-400 text-right font-semibold">{formatCOP(row.gananciaProfesional)}</td>
                        <td className="px-4 py-3 text-purple-700 dark:text-purple-400 text-right font-medium">{formatCOP(row.gananciaCentro)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => toggle(key)}
                            className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                          >
                            {isOpen ? 'Ocultar' : 'Ver detalle'}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={9} className="bg-slate-50 dark:bg-slate-800/40 px-4 py-4">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                              Detalle de operaciones — {row.profesional}
                            </p>
                            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-50 text-slate-500 text-left dark:bg-slate-800/60 dark:text-slate-400">
                                  <tr>
                                    <th className="px-3 py-2 font-medium">Fecha</th>
                                    <th className="px-3 py-2 font-medium">Comprobante</th>
                                    <th className="px-3 py-2 font-medium">Cliente/Paciente</th>
                                    <th className="px-3 py-2 font-medium">Paquete</th>
                                    <th className="px-3 py-2 font-medium">Tipo</th>
                                    <th className="px-3 py-2 font-medium text-right">Valor venta</th>
                                    <th className="px-3 py-2 font-medium text-right">Costo med.</th>
                                    <th className="px-3 py-2 font-medium text-right">Costo oper.</th>
                                    <th className="px-3 py-2 font-medium text-right">Utilidad</th>
                                    <th className="px-3 py-2 font-medium text-right">% Prof.</th>
                                    <th className="px-3 py-2 font-medium text-right">Gan. prof.</th>
                                    <th className="px-3 py-2 font-medium text-right">% Centro</th>
                                    <th className="px-3 py-2 font-medium text-right">Gan. centro</th>
                                    <th className="px-3 py-2 font-medium">Almacén</th>
                                    <th className="px-3 py-2 font-medium">Sesión</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {rows.map(d => (
                                    <tr key={d.salePackageId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(d.fecha)}</td>
                                      <td className="px-3 py-2 text-slate-800 dark:text-slate-100 font-medium whitespace-nowrap">{d.comprobante}</td>
                                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{d.paciente ?? 'N/A'}</td>
                                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{d.paquete ?? 'N/A'}</td>
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{d.tipoOperacion}</td>
                                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200 text-right whitespace-nowrap">{formatCOP(d.valorVenta)}</td>
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">{formatCOP(d.costoMedicamentos)}</td>
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">{formatCOP(d.costoOperativo)}</td>
                                      <td className="px-3 py-2 text-slate-800 dark:text-slate-100 text-right whitespace-nowrap">{formatCOP(d.utilidad)}</td>
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">{d.porcentajeProfesional}%</td>
                                      <td className="px-3 py-2 text-green-700 dark:text-emerald-400 text-right font-medium whitespace-nowrap">{formatCOP(d.gananciaProfesional)}</td>
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">{d.porcentajeCentro}%</td>
                                      <td className="px-3 py-2 text-purple-700 dark:text-purple-400 text-right font-medium whitespace-nowrap">{formatCOP(d.gananciaCentro)}</td>
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{d.almacen ?? 'N/A'}</td>
                                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                        {d.sesionNumero != null
                                          ? `Sesión ${d.sesionNumero}${d.sesionesTotales != null ? ` / ${d.sesionesTotales}` : ''}`
                                          : 'N/A'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

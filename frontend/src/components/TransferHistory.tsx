import { useState, useEffect, useCallback } from 'react';
import { useWarehouse } from '../context/WarehouseContext';
import { fetchTransferHistory } from '../api/warehouseApi';
import type { TransferHistory as TransferHistoryRow } from '../types/warehouse';
import TransferDetailModal from './TransferDetailModal';

type SortKey = 'fecha' | 'origen' | 'destino';

function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function TransferHistory() {
  const { selectedWarehouseId } = useWarehouse();
  const [transfers, setTransfers] = useState<TransferHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TransferHistoryRow | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'fecha', dir: 'desc' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransferHistory(selectedWarehouseId ?? undefined);
      setTransfers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => { load(); }, [load]);

  function toggleSort(key: SortKey) {
    setSort(prev => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  const sorted = [...transfers].sort((a, b) => {
    let cmp: number;
    if (sort.key === 'fecha') {
      cmp = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    } else if (sort.key === 'origen') {
      cmp = (a.origen?.nombre ?? '').localeCompare(b.origen?.nombre ?? '');
    } else {
      cmp = (a.destino?.nombre ?? '').localeCompare(b.destino?.nombre ?? '');
    }
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  function header(label: string, key: SortKey) {
    return (
      <th className="px-4 py-3 font-medium">
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className="flex items-center gap-1 hover:text-gray-800 cursor-pointer"
        >
          {label}
          <span className="text-xs">{sort.key === key ? (sort.dir === 'asc' ? '↑' : '↓') : ''}</span>
        </button>
      </th>
    );
  }

  if (loading) {
    return <p className="text-gray-400 text-sm">Cargando...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  if (sorted.length === 0) {
    return <p className="text-gray-400 text-sm">No hay traslados registrados.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 text-left">
            <tr>
              {header('Fecha', 'fecha')}
              {header('Almacén origen', 'origen')}
              {header('Almacén destino', 'destino')}
              <th className="px-4 py-3 font-medium">Productos</th>
              <th className="px-4 py-3 font-medium">Unidades</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{formatFecha(t.fecha)}</td>
                <td className="px-4 py-3 text-gray-800">{t.origen?.nombre ?? '—'}</td>
                <td className="px-4 py-3 text-gray-800">{t.destino?.nombre ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">{t.productosDiferentes}</td>
                <td className="px-4 py-3 text-gray-700">{t.totalUnidades}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setSelected(t)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <TransferDetailModal transfer={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

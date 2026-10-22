import type { TransferHistory } from '../types/warehouse';

interface Props {
  transfer: TransferHistory;
  onClose: () => void;
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stockRange(before: number | null, after: number | null): string {
  if (before === null && after === null) return '—';
  return `${before ?? '—'} → ${after ?? '—'}`;
}

export default function TransferDetailModal({ transfer, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
      <div className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 mx-4">
        <h2 className="mb-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Detalle del traslado</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Movimiento entre almacenes. No es una venta.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Fecha</p>
            <p className="text-sm text-slate-800 dark:text-slate-100">{formatFecha(transfer.fecha)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Almacén origen</p>
            <p className="text-sm text-slate-800 dark:text-slate-100">{transfer.origen?.nombre ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Almacén destino</p>
            <p className="text-sm text-slate-800 dark:text-slate-100">{transfer.destino?.nombre ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Productos diferentes</p>
            <p className="text-sm text-slate-800 dark:text-slate-100">{transfer.productosDiferentes}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de unidades</p>
            <p className="text-sm text-slate-800 dark:text-slate-100">{transfer.totalUnidades}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 mb-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Código</th>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Cantidad</th>
                <th className="px-4 py-2 font-medium">Stock origen</th>
                <th className="px-4 py-2 font-medium">Stock destino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transfer.items.map(item => (
                <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{item.codigo}</td>
                  <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">{item.nombre}</td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{item.cantidad}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{stockRange(item.stockOrigenBefore, item.stockOrigenAfter)}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{stockRange(item.stockDestinoBefore, item.stockDestinoAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 mb-6">
          Total de unidades trasladadas: <span className="font-medium">{transfer.totalUnidades}</span>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

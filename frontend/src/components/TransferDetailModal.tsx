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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 mx-4">
        <h2 className="text-xl font-bold mb-1 text-gray-800">Detalle del traslado</h2>
        <p className="text-sm text-gray-500 mb-4">Movimiento entre almacenes. No es una venta.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          <div>
            <p className="text-xs font-medium text-gray-500">Fecha</p>
            <p className="text-sm text-gray-800">{formatFecha(transfer.fecha)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Almacén origen</p>
            <p className="text-sm text-gray-800">{transfer.origen?.nombre ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Almacén destino</p>
            <p className="text-sm text-gray-800">{transfer.destino?.nombre ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Productos diferentes</p>
            <p className="text-sm text-gray-800">{transfer.productosDiferentes}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total de unidades</p>
            <p className="text-sm text-gray-800">{transfer.totalUnidades}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Código</th>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Cantidad</th>
                <th className="px-4 py-2 font-medium">Stock origen</th>
                <th className="px-4 py-2 font-medium">Stock destino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfer.items.map(item => (
                <tr key={item.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500">{item.codigo}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{item.nombre}</td>
                  <td className="px-4 py-2 text-gray-700">{item.cantidad}</td>
                  <td className="px-4 py-2 text-gray-600">{stockRange(item.stockOrigenBefore, item.stockOrigenAfter)}</td>
                  <td className="px-4 py-2 text-gray-600">{stockRange(item.stockDestinoBefore, item.stockDestinoAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-gray-700 mb-6">
          Total de unidades trasladadas: <span className="font-medium">{transfer.totalUnidades}</span>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

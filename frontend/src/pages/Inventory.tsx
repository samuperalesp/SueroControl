import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types/product';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../api/productApi';
import ProductModal from '../components/ProductModal';
import TransferModal from '../components/TransferModal';
import TransferHistory from '../components/TransferHistory';
import { useWarehouse } from '../context/WarehouseContext';

type Tab = 'inventario' | 'historial';

export default function Inventory() {
  const { selectedWarehouseId, warehouses } = useWarehouse();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState<Product | 'new' | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [tab, setTab] = useState<Tab>('inventario');
  const [historyKey, setHistoryKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProducts(selectedWarehouseId ?? undefined);
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase()),
  );

  function handleCreate() {
    setModalProduct('new');
  }

  function handleEdit(p: Product) {
    setModalProduct(p);
  }

  async function handleSave(data: Parameters<typeof createProduct>[0]) {
    const payload = selectedWarehouseId ? { ...data, warehouseId: selectedWarehouseId } : data;
    if (modalProduct && modalProduct !== 'new') {
      await updateProduct(modalProduct.id, payload);
    } else {
      await createProduct(payload);
    }
    setModalProduct(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="sc-page-title">Inventario</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTransfer(true)}
            disabled={warehouses.length < 2}
            title={warehouses.length < 2 ? 'Se necesitan al menos dos almacenes' : 'Trasladar stock entre almacenes'}
            className="whitespace-nowrap rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            Trasladar stock
          </button>
          <button onClick={handleCreate} className="whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-blue-500 dark:hover:bg-blue-400 cursor-pointer">
            + Nuevo Producto
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab('inventario')}
          className={`shrink-0 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            tab === 'inventario' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Inventario
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`shrink-0 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            tab === 'historial' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Historial de traslados
        </button>
      </div>

      {tab === 'historial' ? (
        <TransferHistory key={historyKey} />
      ) : (
        <>
      <input
        type="text"
        placeholder="Buscar por nombre, código o categoría..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 mb-4"
      />

      {loading ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm">No hay productos.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Costo</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Mínimo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.codigo}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{p.nombre}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.categoria}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">${p.costoCompra.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">${p.precioVenta.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${p.stockActual <= p.stockMinimo ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {p.stockActual}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.stockMinimo}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.activo ? 'bg-green-100 dark:bg-emerald-500/15 text-green-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleEdit(p)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium cursor-pointer">Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-medium cursor-pointer">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      )}

      {modalProduct !== null && (
        <ProductModal
          product={modalProduct === 'new' ? null : modalProduct}
          onSave={handleSave}
          onClose={() => setModalProduct(null)}
        />
      )}

      {showTransfer && (
        <TransferModal
          onClose={() => setShowTransfer(false)}
          onTransferred={() => { load(); setHistoryKey(k => k + 1); }}
        />
      )}
    </div>
  );
}

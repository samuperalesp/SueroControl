import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types/product';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../api/productApi';
import ProductModal from '../components/ProductModal';
import TransferModal from '../components/TransferModal';
import { useWarehouse } from '../context/WarehouseContext';

export default function Inventory() {
  const { selectedWarehouseId, warehouses } = useWarehouse();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState<Product | 'new' | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransfer(true)}
            disabled={warehouses.length < 2}
            title={warehouses.length < 2 ? 'Se necesitan al menos dos almacenes' : 'Trasladar stock entre almacenes'}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Trasladar stock
          </button>
          <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer">
            + Nuevo Producto
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, código o categoría..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 mb-4"
      />

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">No hay productos.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
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
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{p.codigo}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{p.categoria}</td>
                  <td className="px-4 py-3 text-gray-700">${p.costoCompra.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-700">${p.precioVenta.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${p.stockActual <= p.stockMinimo ? 'text-red-600' : 'text-gray-800'}`}>
                      {p.stockActual}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.stockMinimo}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer">Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 text-xs font-medium cursor-pointer">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          onTransferred={load}
        />
      )}
    </div>
  );
}

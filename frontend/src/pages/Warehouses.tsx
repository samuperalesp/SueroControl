import { useState, useEffect, useCallback } from 'react';
import type { Warehouse } from '../types/warehouse';
import { fetchAllWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../api/warehouseApi';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';

interface FormState {
  nombre: string;
  activo: boolean;
}

export default function Warehouses() {
  const { user } = useAuth();
  const { refresh } = useWarehouse();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<FormState>({ nombre: '', activo: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllWarehouses();
      setWarehouses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ nombre: '', activo: true });
    setShowModal(true);
  }

  function openEdit(w: Warehouse) {
    setEditing(w);
    setForm({ nombre: w.nombre, activo: w.activo });
    setShowModal(true);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = 'Requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        const dto: { nombre?: string; activo?: boolean } = {};
        if (form.nombre !== editing.nombre) dto.nombre = form.nombre.trim();
        if (form.activo !== editing.activo) dto.activo = form.activo;
        if (Object.keys(dto).length > 0) {
          await updateWarehouse(editing.id, dto);
        }
      } else {
        await createWarehouse({ nombre: form.nombre.trim(), activo: form.activo });
      }
      setShowModal(false);
      await load();
      await refresh();
    } catch (e: any) {
      setErrors({ general: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(w: Warehouse) {
    if (w.esPrincipal) return;
    if (!confirm(`¿Desactivar el almacén "${w.nombre}"?`)) return;
    try {
      await deleteWarehouse(w.id);
      await load();
      await refresh();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Almacenes</h2>
        {isAdmin && (
          <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer">
            + Nuevo Almacén
          </button>
        )}
      </div>

      {!isAdmin && (
        <p className="text-sm text-gray-500 mb-4">Solo los administradores pueden gestionar almacenes.</p>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : warehouses.length === 0 ? (
        <p className="text-gray-400 text-sm">No hay almacenes.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Principal</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {warehouses.map(w => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{w.nombre}</td>
                  <td className="px-4 py-3">
                    {w.esPrincipal ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Principal</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${w.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {w.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {isAdmin && (
                      <>
                        <button onClick={() => openEdit(w)} className="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer">Editar</button>
                        {!w.esPrincipal && (
                          <button onClick={() => handleDelete(w)} className="text-red-600 hover:text-red-800 text-xs font-medium cursor-pointer">
                            {w.activo ? 'Desactivar' : 'Eliminar'}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {editing ? 'Editar Almacén' : 'Nuevo Almacén'}
            </h2>

            {errors.general && <p className="text-red-500 text-xs mb-3">{errors.general}</p>}

            <div className="flex flex-col gap-1 mb-4">
              <label className="text-xs font-medium text-gray-600">Nombre</label>
              <input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.nombre ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.nombre && <span className="text-xs text-red-500">{errors.nombre}</span>}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} className="accent-blue-600" />
              Almacén activo
            </label>
            {editing?.esPrincipal && (
              <p className="text-xs text-gray-400 mt-2">El almacén principal no puede desactivarse ni perder su rol.</p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

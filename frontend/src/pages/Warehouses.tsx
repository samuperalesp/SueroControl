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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="sc-page-title">Almacenes</h2>
        {isAdmin && (
          <button onClick={openCreate} className="w-fit whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-blue-500 dark:hover:bg-blue-400 cursor-pointer">
            + Nuevo Almacén
          </button>
        )}
      </div>

      {!isAdmin && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Solo los administradores pueden gestionar almacenes.</p>
      )}

      {loading ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
      ) : warehouses.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm">No hay almacenes.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Principal</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {warehouses.map(w => (
                <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{w.nombre}</td>
                  <td className="px-4 py-3">
                    {w.esPrincipal ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400">Principal</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${w.activo ? 'bg-green-100 dark:bg-emerald-500/15 text-green-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      {w.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {isAdmin && (
                      <>
                        <button onClick={() => openEdit(w)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium cursor-pointer">Editar</button>
                        {!w.esPrincipal && (
                          <button onClick={() => handleDelete(w)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-medium cursor-pointer">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
          <form onSubmit={handleSave} className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-md p-6 mx-4">
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              {editing ? 'Editar Almacén' : 'Nuevo Almacén'}
            </h2>

            {errors.general && <p className="text-red-500 dark:text-red-400 text-xs mb-3">{errors.general}</p>}

            <div className="flex flex-col gap-1 mb-4">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Nombre</label>
              <input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className={`border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.nombre ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}
              />
              {errors.nombre && <span className="text-xs text-red-500 dark:text-red-400">{errors.nombre}</span>}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} className="accent-blue-600" />
              Almacén activo
            </label>
            {editing?.esPrincipal && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">El almacén principal no puede desactivarse ni perder su rol.</p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-blue-500 hover:bg-slate-800 dark:hover:bg-blue-400 disabled:opacity-50 cursor-pointer">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

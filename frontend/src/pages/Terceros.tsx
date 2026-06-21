import { useState, useEffect, useCallback } from 'react';
import type { Tercero, CreateTerceroDto } from '../types/tercero';
import { fetchTerceros, createTercero, updateTercero, deleteTercero } from '../api/terceroApi';

const tipoRelacionOptions = [
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'PROVEEDOR', label: 'Proveedor' },
  { value: 'CLIENTE_PROVEEDOR', label: 'Cliente y Proveedor' },
];

const documentoOptions = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PAS', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
];

const docLabel: Record<string, string> = {
  CC: 'CC', CE: 'CE', NIT: 'NIT', PAS: 'PAS', TI: 'TI',
};

const emptyForm: CreateTerceroDto = {
  tipoRelacion: 'CLIENTE',
  tipoPersona: 'NATURAL',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  digitoVerificacion: '',
  nombres: '',
  apellidos: '',
  razonSocial: '',
  direccion: '',
  ciudad: '',
  departamento: '',
  telefono: '',
  email: '',
  observaciones: '',
  activo: true,
};

export default function Terceros() {
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tercero | null>(null);
  const [form, setForm] = useState<CreateTerceroDto>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTerceros();
      setTerceros(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(t: Tercero) {
    setEditing(t);
    setForm({
      tipoRelacion: t.tipoRelacion,
      tipoPersona: t.tipoPersona,
      tipoDocumento: t.tipoDocumento,
      numeroDocumento: t.numeroDocumento,
      digitoVerificacion: t.digitoVerificacion || '',
      nombres: t.nombres || '',
      apellidos: t.apellidos || '',
      razonSocial: t.razonSocial || '',
      direccion: t.direccion || '',
      ciudad: t.ciudad || '',
      departamento: t.departamento || '',
      telefono: t.telefono || '',
      email: t.email || '',
      observaciones: t.observaciones || '',
      activo: t.activo,
    });
    setErrors({});
    setShowModal(true);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.numeroDocumento.trim()) errs.numeroDocumento = 'Requerido';
    if (form.tipoDocumento === 'NIT' && !form.digitoVerificacion?.trim()) {
      errs.digitoVerificacion = 'Requerido para NIT';
    }
    if (form.tipoPersona === 'NATURAL') {
      if (!form.nombres?.trim()) errs.nombres = 'Requerido';
      if (!form.apellidos?.trim()) errs.apellidos = 'Requerido';
    } else {
      if (!form.razonSocial?.trim()) errs.razonSocial = 'Requerido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.tipoDocumento !== 'NIT') delete payload.digitoVerificacion;
      if (editing) {
        await updateTercero(editing.id, payload);
      } else {
        await createTercero(payload);
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      setErrors({ general: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este tercero?')) return;
    try {
      await deleteTercero(id);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  const relacionLabel: Record<string, string> = {
    CLIENTE: 'Cliente',
    PROVEEDOR: 'Proveedor',
    CLIENTE_PROVEEDOR: 'Cli/Prov',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Terceros</h2>
        <button onClick={openNew} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer">
          + Nuevo Tercero
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : terceros.length === 0 ? (
        <p className="text-gray-400 text-sm">No hay terceros registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Relación</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {terceros.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">
                    {docLabel[t.tipoDocumento] || t.tipoDocumento}: {t.numeroDocumento}
                    {t.digitoVerificacion ? `-${t.digitoVerificacion}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {t.tipoPersona === 'NATURAL'
                      ? `${t.nombres} ${t.apellidos}`
                      : t.razonSocial}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {t.tipoPersona === 'NATURAL' ? 'Natural' : 'Jurídica'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {relacionLabel[t.tipoRelacion] || t.tipoRelacion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.telefono || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${t.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(t)} className="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer">Editar</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 text-xs font-medium cursor-pointer">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {editing ? 'Editar Tercero' : 'Nuevo Tercero'}
            </h3>

            {errors.general && <p className="text-red-500 text-xs mb-3">{errors.general}</p>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo Persona</label>
                <select value={form.tipoPersona} onChange={e => setForm({ ...form, tipoPersona: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="NATURAL">Persona Natural</option>
                  <option value="JURIDICA">Persona Jurídica</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Relación</label>
                <select value={form.tipoRelacion} onChange={e => setForm({ ...form, tipoRelacion: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                  {tipoRelacionOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo Documento</label>
                <select value={form.tipoDocumento} onChange={e => setForm({ ...form, tipoDocumento: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                  {documentoOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">N° Documento</label>
                <input value={form.numeroDocumento} onChange={e => setForm({ ...form, numeroDocumento: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${errors.numeroDocumento ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.numeroDocumento && <span className="text-xs text-red-500">{errors.numeroDocumento}</span>}
              </div>

              {form.tipoDocumento === 'NIT' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Dígito Verificación</label>
                  <input value={form.digitoVerificacion || ''} onChange={e => setForm({ ...form, digitoVerificacion: e.target.value })} maxLength={1} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${errors.digitoVerificacion ? 'border-red-400' : 'border-gray-300'}`} />
                  {errors.digitoVerificacion && <span className="text-xs text-red-500">{errors.digitoVerificacion}</span>}
                </div>
              )}

              {form.tipoPersona === 'NATURAL' ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Nombres</label>
                    <input value={form.nombres || ''} onChange={e => setForm({ ...form, nombres: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${errors.nombres ? 'border-red-400' : 'border-gray-300'}`} />
                    {errors.nombres && <span className="text-xs text-red-500">{errors.nombres}</span>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Apellidos</label>
                    <input value={form.apellidos || ''} onChange={e => setForm({ ...form, apellidos: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${errors.apellidos ? 'border-red-400' : 'border-gray-300'}`} />
                    {errors.apellidos && <span className="text-xs text-red-500">{errors.apellidos}</span>}
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Razón Social</label>
                  <input value={form.razonSocial || ''} onChange={e => setForm({ ...form, razonSocial: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${errors.razonSocial ? 'border-red-400' : 'border-gray-300'}`} />
                  {errors.razonSocial && <span className="text-xs text-red-500">{errors.razonSocial}</span>}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Teléfono</label>
                <input value={form.telefono || ''} onChange={e => setForm({ ...form, telefono: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
                <input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Dirección</label>
                <input value={form.direccion || ''} onChange={e => setForm({ ...form, direccion: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Ciudad</label>
                <input value={form.ciudad || ''} onChange={e => setForm({ ...form, ciudad: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Observaciones</label>
                <input value={form.observaciones || ''} onChange={e => setForm({ ...form, observaciones: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-4 text-sm text-gray-700">
              <input type="checkbox" checked={form.activo ?? true} onChange={e => setForm({ ...form, activo: e.target.checked })} className="accent-blue-600" />
              Activo
            </label>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

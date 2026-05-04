import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiTag } from 'react-icons/fi';

export default function Tratamientos() {
  const [tratamientos, setTratamientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [modalCat, setModalCat] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', duracion_minutos: '30', categoria_id: '' });
  const [formCat, setFormCat] = useState({ nombre: '', descripcion: '' });

  const cargar = async () => {
    setLoading(true);
    try {
      const [tratRes, catRes] = await Promise.all([
        api.get('/tratamientos'),
        api.get('/tratamientos/categorias')
      ]);
      setTratamientos(tratRes.data);
      setCategorias(catRes.data);
    } catch {
      toast.error('Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setForm({ nombre: '', descripcion: '', precio: '', duracion_minutos: '30', categoria_id: '' });
    setEditando(null);
    setModal(true);
  };

  const abrirEditar = (t) => {
    setForm({ nombre: t.nombre, descripcion: t.descripcion || '', precio: t.precio, duracion_minutos: t.duracion_minutos || '30', categoria_id: t.categoria_id || '' });
    setEditando(t.id);
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, precio: parseFloat(form.precio), duracion_minutos: parseInt(form.duracion_minutos), categoria_id: form.categoria_id || null };
      if (editando) {
        await api.put(`/tratamientos/${editando}`, data);
        toast.success('Tratamiento actualizado');
      } else {
        await api.post('/tratamientos', data);
        toast.success('Tratamiento creado');
      }
      setModal(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tratamientos/categorias', formCat);
      toast.success('Categoría creada');
      setModalCat(false);
      setFormCat({ nombre: '', descripcion: '' });
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear categoría');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Desactivar este tratamiento?')) return;
    try {
      await api.delete(`/tratamientos/${id}`);
      toast.success('Tratamiento desactivado');
      cargar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary-800">Catálogo de Tratamientos</h1>
        <div className="flex gap-2">
          <button onClick={() => setModalCat(true)} className="btn-secondary flex items-center gap-2">
            <FiTag size={16} /> Nueva Categoría
          </button>
          <button onClick={abrirNuevo} className="btn-primary flex items-center gap-2">
            <FiPlus size={16} /> Nuevo Tratamiento
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando...</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Tratamiento</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Duración</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tratamientos.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-surface-400">No hay tratamientos registrados</td></tr>
              ) : tratamientos.map(t => (
                <tr key={t.id}>
                  <td>
                    <p className="font-semibold text-primary-900">{t.nombre}</p>
                    {t.descripcion && <p className="text-xs text-surface-400 mt-0.5">{t.descripcion}</p>}
                  </td>
                  <td><span className="badge bg-surface-100 text-surface-600">{t.categoria?.nombre || '-'}</span></td>
                  <td className="font-semibold text-dental-600">${Number(t.precio).toLocaleString()}</td>
                  <td className="text-surface-600">{t.duracion_minutos} min</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => abrirEditar(t)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"><FiEdit2 size={16} /></button>
                      <button onClick={() => eliminar(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><FiTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tratamiento */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editando ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}>
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Categoría</label>
            <select name="categoria_id" value={form.categoria_id} onChange={handleChange} className="input-field">
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Precio *</label>
              <input name="precio" type="number" step="0.01" value={form.precio} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Duración (min)</label>
              <input name="duracion_minutos" type="number" value={form.duracion_minutos} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="input-field" rows={2} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{editando ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Categoría */}
      <Modal isOpen={modalCat} onClose={() => setModalCat(false)} title="Nueva Categoría" size="sm">
        <form onSubmit={guardarCategoria} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Nombre *</label>
            <input value={formCat.nombre} onChange={e => setFormCat({ ...formCat, nombre: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Descripción</label>
            <textarea value={formCat.descripcion} onChange={e => setFormCat({ ...formCat, descripcion: e.target.value })} className="input-field" rows={2} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalCat(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Crear</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function Usuarios() {
  const { usuario: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', rol: 'recepcionista', especialidad: '', telefono: '' });

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setForm({ nombre: '', apellido: '', email: '', password: '', rol: 'recepcionista', especialidad: '', telefono: '' });
    setEditando(null);
    setModal(true);
  };

  const abrirEditar = (u) => {
    setForm({ nombre: u.nombre, apellido: u.apellido, email: u.email, password: '', rol: u.rol, especialidad: u.especialidad || '', telefono: u.telefono || '' });
    setEditando(u.id);
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editando) {
        await api.put(`/usuarios/${editando}`, data);
        toast.success('Usuario actualizado');
      } else {
        if (!data.password) {
          toast.error('La contraseña es obligatoria');
          return;
        }
        await api.post('/usuarios', data);
        toast.success('Usuario creado');
      }
      setModal(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      toast.success('Usuario desactivado');
      cargar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const ROLES_COLOR = {
    administrador: 'bg-purple-100 text-purple-700',
    doctor: 'bg-blue-100 text-blue-700',
    recepcionista: 'bg-green-100 text-green-700'
  };

  const esAdmin = currentUser?.rol === 'administrador';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary-800">Usuarios</h1>
        {esAdmin && (
          <button onClick={abrirNuevo} className="btn-primary flex items-center gap-2">
            <FiPlus size={16} /> Nuevo Usuario
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando...</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Especialidad</th>
                <th>Estado</th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-dental-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {u.nombre[0]}{u.apellido[0]}
                      </div>
                      <span className="font-semibold text-primary-900">{u.nombre} {u.apellido}</span>
                    </div>
                  </td>
                  <td className="text-surface-600">{u.email}</td>
                  <td><span className={`badge ${ROLES_COLOR[u.rol]} capitalize`}>{u.rol}</span></td>
                  <td className="text-surface-600">{u.especialidad || '-'}</td>
                  <td>
                    <span className={`badge ${u.activo ? 'bg-dental-100 text-dental-700' : 'bg-red-100 text-red-700'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {esAdmin && (
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirEditar(u)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"><FiEdit2 size={16} /></button>
                        {u.id !== currentUser.id && (
                          <button onClick={() => eliminar(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><FiTrash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editando ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Apellido *</label>
              <input name="apellido" value={form.apellido} onChange={handleChange} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Contraseña {editando ? '(dejar vacío para mantener)' : '*'}</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" {...(!editando && { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Rol *</label>
              <select name="rol" value={form.rol} onChange={handleChange} className="input-field" required>
                <option value="recepcionista">Recepcionista</option>
                <option value="doctor">Doctor</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} className="input-field" />
            </div>
          </div>
          {form.rol === 'doctor' && (
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Especialidad</label>
              <input name="especialidad" value={form.especialidad} onChange={handleChange} className="input-field" placeholder="Ej: Ortodoncia, Endodoncia..." />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{editando ? 'Actualizar' : 'Crear Usuario'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

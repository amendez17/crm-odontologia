import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiEdit2, FiEye, FiTrash2, FiDownload, FiUsers, FiUserPlus } from 'react-icons/fi';

const formInicial = {
  nombre: '', apellido: '', dni: '', fecha_nacimiento: '', genero: '',
  telefono: '', email: '', direccion: '', obra_social: '', numero_afiliado: '',
  antecedentes_medicos: '', alergias: '', medicamentos: '', notas: ''
};

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalPacientes, setTotalPacientes] = useState(0);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/pacientes', { params: { buscar, page: pagina } });
      setPacientes(data.pacientes);
      setTotalPaginas(data.totalPaginas);
      setTotalPacientes(data.total || 0);
    } catch {
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [buscar, pagina]);

  const abrirNuevo = () => {
    setForm(formInicial);
    setEditando(null);
    setModal(true);
  };

  const abrirEditar = (pac) => {
    setForm({
      nombre: pac.nombre, apellido: pac.apellido, dni: pac.dni,
      fecha_nacimiento: pac.fecha_nacimiento || '', genero: pac.genero || '',
      telefono: pac.telefono || '', email: pac.email || '', direccion: pac.direccion || '',
      obra_social: pac.obra_social || '', numero_afiliado: pac.numero_afiliado || '',
      antecedentes_medicos: pac.antecedentes_medicos || '', alergias: pac.alergias || '',
      medicamentos: pac.medicamentos || '', notas: pac.notas || ''
    });
    setEditando(pac.id);
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/pacientes/${editando}`, form);
        toast.success('Paciente actualizado');
      } else {
        await api.post('/pacientes', form);
        toast.success('Paciente creado');
      }
      setModal(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Desactivar este paciente?')) return;
    try {
      await api.delete(`/pacientes/${id}`);
      toast.success('Paciente desactivado');
      cargar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">Pacientes</h1>
          <p className="text-sm text-surface-500">{totalPacientes} pacientes registrados</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/exportar/pacientes" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
            <FiDownload size={16} /> CSV
          </a>
          <button onClick={abrirNuevo} className="btn-primary flex items-center gap-2">
            <FiPlus size={16} /> Nuevo Paciente
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o DNI..."
          value={buscar}
          onChange={(e) => { setBuscar(e.target.value); setPagina(1); }}
          className="input-field pl-11"
        />
      </div>

      {/* Tabla */}
      <div className="card overflow-x-auto p-0">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Obra Social</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-surface-400">Cargando...</td></tr>
            ) : pacientes.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-surface-400">No se encontraron pacientes</td></tr>
            ) : pacientes.map(pac => (
              <tr key={pac.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-dental-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                      {pac.nombre[0]}{pac.apellido[0]}
                    </div>
                    <span className="font-semibold text-primary-900">{pac.apellido}, {pac.nombre}</span>
                  </div>
                </td>
                <td className="text-surface-600">{pac.dni}</td>
                <td className="text-surface-600">{pac.telefono || '-'}</td>
                <td className="text-surface-600">{pac.obra_social || '-'}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link to={`/pacientes/${pac.id}`} className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors" title="Ver detalle">
                      <FiEye size={16} />
                    </Link>
                    <button onClick={() => abrirEditar(pac)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors" title="Editar">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => eliminar(pac.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Eliminar">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPaginas }, (_, i) => (
            <button
              key={i}
              onClick={() => setPagina(i + 1)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${pagina === i + 1 ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md' : 'bg-white/80 text-surface-600 hover:bg-primary-50 border border-surface-200'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editando ? 'Editar Paciente' : 'Nuevo Paciente'} size="lg">
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Apellido *</label>
              <input name="apellido" value={form.apellido} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">DNI *</label>
              <input name="dni" value={form.dni} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Fecha de Nacimiento</label>
              <input name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Género</label>
              <select name="genero" value={form.genero} onChange={handleChange} className="input-field">
                <option value="">Seleccionar</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Obra Social</label>
              <input name="obra_social" value={form.obra_social} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">N° Afiliado</label>
              <input name="numero_afiliado" value={form.numero_afiliado} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Antecedentes Médicos</label>
            <textarea name="antecedentes_medicos" value={form.antecedentes_medicos} onChange={handleChange} className="input-field" rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Alergias</label>
              <textarea name="alergias" value={form.alergias} onChange={handleChange} className="input-field" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Medicamentos</label>
              <textarea name="medicamentos" value={form.medicamentos} onChange={handleChange} className="input-field" rows={2} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} className="input-field" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{editando ? 'Actualizar' : 'Crear Paciente'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

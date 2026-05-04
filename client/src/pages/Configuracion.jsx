import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FiSave } from 'react-icons/fi';

export default function Configuracion() {
  const { usuario } = useAuth();
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/configuracion')
      .then(res => setConfig(res.data))
      .catch(() => toast.error('Error al cargar configuración'))
      .finally(() => setLoading(false));
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/configuracion', config);
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (clave, valor) => {
    setConfig(prev => ({ ...prev, [clave]: valor }));
  };

  const esAdmin = usuario?.rol === 'administrador';

  if (loading) return <div className="text-center py-10 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-primary-800">Configuración de la Clínica</h1>

      <form onSubmit={guardar} className="space-y-6">
        {/* Datos de la clínica */}
        <div className="card">
          <h3 className="font-semibold text-primary-900 mb-4">Datos de la Clínica</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Nombre de la clínica</label>
              <input
                value={config.clinica_nombre || ''}
                onChange={e => handleChange('clinica_nombre', e.target.value)}
                className="input-field"
                disabled={!esAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Responsable / Director</label>
              <input
                value={config.clinica_responsable || ''}
                onChange={e => handleChange('clinica_responsable', e.target.value)}
                className="input-field"
                disabled={!esAdmin}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">CUIT</label>
                <input
                  value={config.clinica_cuit || ''}
                  onChange={e => handleChange('clinica_cuit', e.target.value)}
                  className="input-field"
                  placeholder="XX-XXXXXXXX-X"
                  disabled={!esAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Teléfono</label>
                <input
                  value={config.clinica_telefono || ''}
                  onChange={e => handleChange('clinica_telefono', e.target.value)}
                  className="input-field"
                  disabled={!esAdmin}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Dirección</label>
              <input
                value={config.clinica_direccion || ''}
                onChange={e => handleChange('clinica_direccion', e.target.value)}
                className="input-field"
                disabled={!esAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Email</label>
              <input
                type="email"
                value={config.clinica_email || ''}
                onChange={e => handleChange('clinica_email', e.target.value)}
                className="input-field"
                disabled={!esAdmin}
              />
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div className="card">
          <h3 className="font-semibold text-primary-900 mb-4">Horarios de Atención</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Horario de apertura</label>
                <input
                  type="time"
                  value={config.clinica_horario_inicio || '08:00'}
                  onChange={e => handleChange('clinica_horario_inicio', e.target.value)}
                  className="input-field"
                  disabled={!esAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Horario de cierre</label>
                <input
                  type="time"
                  value={config.clinica_horario_fin || '18:00'}
                  onChange={e => handleChange('clinica_horario_fin', e.target.value)}
                  className="input-field"
                  disabled={!esAdmin}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Días laborales</label>
              <input
                value={config.clinica_dias_laborales || ''}
                onChange={e => handleChange('clinica_dias_laborales', e.target.value)}
                className="input-field"
                placeholder="Ej: Lunes a Viernes"
                disabled={!esAdmin}
              />
            </div>
          </div>
        </div>

        {/* Preferencias */}
        <div className="card">
          <h3 className="font-semibold text-primary-900 mb-4">Preferencias</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Símbolo de moneda</label>
              <input
                value={config.moneda_simbolo || '$'}
                onChange={e => handleChange('moneda_simbolo', e.target.value)}
                className="input-field"
                disabled={!esAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Duración de turno por defecto (min)</label>
              <input
                type="number"
                value={config.duracion_turno_default || '30'}
                onChange={e => handleChange('duracion_turno_default', e.target.value)}
                className="input-field"
                disabled={!esAdmin}
              />
            </div>
          </div>
        </div>

        {esAdmin && (
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <FiSave size={16} /> {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        )}

        {!esAdmin && (
          <p className="text-sm text-surface-500 italic">Solo los administradores pueden modificar la configuración.</p>
        )}
      </form>
    </div>
  );
}

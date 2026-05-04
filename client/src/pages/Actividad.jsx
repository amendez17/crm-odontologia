import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiActivity, FiFilter } from 'react-icons/fi';

const accionColors = {
  crear: 'bg-green-100 text-green-700',
  actualizar: 'bg-blue-100 text-blue-700',
  eliminar: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  firmar: 'bg-yellow-100 text-yellow-700',
};

export default function Actividad() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtros, setFiltros] = useState({ entidad: '', accion: '', desde: '', hasta: '' });
  const [showFiltros, setShowFiltros] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargar = async (pag = pagina) => {
    setLoading(true);
    try {
      const params = { page: pag, limit: 30 };
      if (filtros.entidad) params.entidad = filtros.entidad;
      if (filtros.accion) params.accion = filtros.accion;
      if (filtros.desde) params.desde = filtros.desde;
      if (filtros.hasta) params.hasta = filtros.hasta;
      const { data } = await api.get('/actividad', { params });
      setLogs(data.logs);
      setTotal(data.total);
      setPagina(data.pagina);
      setTotalPaginas(data.totalPaginas);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(1); }, []);

  const aplicarFiltros = () => {
    cargar(1);
  };

  const limpiarFiltros = () => {
    setFiltros({ entidad: '', accion: '', desde: '', hasta: '' });
    setTimeout(() => cargar(1), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">Registro de Actividad</h1>
          <p className="text-surface-500 text-sm">{total} registros en total</p>
        </div>
        <button onClick={() => setShowFiltros(!showFiltros)} className="btn-secondary flex items-center gap-2">
          <FiFilter size={16} /> Filtros
        </button>
      </div>

      {showFiltros && (
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Entidad</label>
              <select value={filtros.entidad} onChange={e => setFiltros({ ...filtros, entidad: e.target.value })} className="input-field">
                <option value="">Todas</option>
                {['paciente', 'cita', 'presupuesto', 'pago', 'tratamiento', 'usuario', 'consentimiento', 'odontograma', 'historia'].map(e => (
                  <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Acción</label>
              <select value={filtros.accion} onChange={e => setFiltros({ ...filtros, accion: e.target.value })} className="input-field">
                <option value="">Todas</option>
                {['crear', 'actualizar', 'eliminar', 'login', 'firmar'].map(a => (
                  <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Desde</label>
              <input type="date" value={filtros.desde} onChange={e => setFiltros({ ...filtros, desde: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Hasta</label>
              <input type="date" value={filtros.hasta} onChange={e => setFiltros({ ...filtros, hasta: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={aplicarFiltros} className="btn-primary text-sm">Aplicar</button>
            <button onClick={limpiarFiltros} className="btn-secondary text-sm">Limpiar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando...</div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">
          <FiActivity size={40} className="mx-auto mb-3 text-gray-300" />
          <p>No hay registros de actividad</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Detalle</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="text-surface-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    {log.usuario ? (
                      <span className="font-semibold text-primary-900">{log.usuario.nombre} {log.usuario.apellido}</span>
                    ) : (
                      <span className="text-surface-400">Sistema</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${accionColors[log.accion] || 'bg-surface-100 text-surface-600'}`}>
                      {log.accion}
                    </span>
                  </td>
                  <td className="capitalize text-surface-700">
                    {log.entidad}
                    {log.entidad_id && <span className="text-surface-400 ml-1">#{log.entidad_id}</span>}
                  </td>
                  <td className="text-surface-500 max-w-xs truncate">{log.detalle}</td>
                  <td className="text-surface-400 text-xs">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={() => { setPagina(p => p - 1); cargar(pagina - 1); }}
            disabled={pagina <= 1}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="flex items-center text-sm text-surface-600 font-medium bg-white/80 px-4 py-2 rounded-xl border border-surface-200">
            {pagina} / {totalPaginas}
          </span>
          <button
            onClick={() => { setPagina(p => p + 1); cargar(pagina + 1); }}
            disabled={pagina >= totalPaginas}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

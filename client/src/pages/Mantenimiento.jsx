import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  FiDownload, FiUpload, FiAlertTriangle, FiDatabase,
  FiShield, FiRefreshCw, FiCheck, FiInfo, FiActivity,
  FiHardDrive, FiClock, FiServer
} from 'react-icons/fi';

/* ──────────────────────────────────────────────────────────────
   Componente principal
────────────────────────────────────────────────────────────── */
export default function Mantenimiento() {
  const [stats, setStats]             = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // backup
  const [loadingBackup, setLoadingBackup] = useState(false);

  // restaurar
  const [archivoSql, setArchivoSql]   = useState(null);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [progRestore, setProgRestore] = useState(false);
  const fileRef = useRef();

  // reset
  const [showReset, setShowReset]     = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);

  /* ── cargar estadísticas ── */
  const cargarStats = async () => {
    setLoadingStats(true);
    try {
      const { data } = await api.get('/mantenimiento/estadisticas');
      setStats(data);
    } catch {
      toast.error('No se pudieron cargar las estadísticas');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => { cargarStats(); }, []);

  /* ── backup ── */
  const handleBackup = async () => {
    setLoadingBackup(true);
    try {
      const response = await api.get('/mantenimiento/backup', { responseType: 'blob' });
      const cd = response.headers['content-disposition'] || '';
      const match = cd.match(/filename="?([^"]+)"?/);
      const fileName = match ? match[1] : `backup_odonto_${new Date().toISOString().slice(0,10)}.sql`;
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/octet-stream' }));
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
      toast.success('✅ Copia de seguridad descargada');
    } catch {
      toast.error('Error al generar la copia de seguridad');
    } finally {
      setLoadingBackup(false);
    }
  };

  /* ── restaurar ── */
  const handleRestore = async () => {
    if (!archivoSql) return toast.error('Selecciona un archivo .sql');
    setLoadingRestore(true);
    setProgRestore(true);
    const form = new FormData();
    form.append('archivo', archivoSql);
    try {
      await api.post('/mantenimiento/restaurar', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('✅ Sistema restaurado correctamente');
      setArchivoSql(null);
      if (fileRef.current) fileRef.current.value = '';
      cargarStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al restaurar');
    } finally {
      setLoadingRestore(false);
      setProgRestore(false);
    }
  };

  /* ── reset ── */
  const handleReset = async () => {
    if (confirmText !== 'RESET SISTEMA') {
      return toast.error('Debes escribir exactamente: RESET SISTEMA');
    }
    setLoadingReset(true);
    try {
      await api.post('/mantenimiento/reset', { confirmacion: 'RESET SISTEMA' });
      toast.success('✅ Sistema reseteado. Listo para nueva empresa');
      setShowReset(false);
      setConfirmText('');
      cargarStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al resetear el sistema');
    } finally {
      setLoadingReset(false);
    }
  };

  /* ── helpers formato ── */
  const fmtMB = (mb) => mb >= 1 ? `${mb} MB` : `${(mb * 1024).toFixed(0)} KB`;
  const fmtRows = (n) => (n >= 1000 ? `${(n/1000).toFixed(1)}k` : n);

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-800 flex items-center gap-2">
            <FiShield className="text-primary-600" size={26} />
            Mantenimiento del Sistema
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Gestiona copias de seguridad, restauración y reseteo del sistema
          </p>
        </div>
        <button
          onClick={cargarStats}
          disabled={loadingStats}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <FiRefreshCw size={14} className={loadingStats ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* ── Stats DB ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<FiServer size={22} />}
          label="Base de datos"
          value={stats?.base_datos ?? '—'}
          color="primary"
          loading={loadingStats}
        />
        <StatCard
          icon={<FiHardDrive size={22} />}
          label="Tamaño total"
          value={stats ? fmtMB(stats.total_mb) : '—'}
          color="dental"
          loading={loadingStats}
        />
        <StatCard
          icon={<FiDatabase size={22} />}
          label="Tablas"
          value={stats ? stats.tablas.length : '—'}
          color="accent"
          loading={loadingStats}
        />
      </div>

      {/* ── Tabla de estadísticas ── */}
      {stats && (
        <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
            <FiActivity size={16} className="text-primary-500" />
            <h2 className="font-semibold text-primary-800 text-sm">Desglose por tabla</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-surface-500 text-xs uppercase tracking-wider">Tabla</th>
                  <th className="px-6 py-3 text-right font-semibold text-surface-500 text-xs uppercase tracking-wider">Registros</th>
                  <th className="px-6 py-3 text-right font-semibold text-surface-500 text-xs uppercase tracking-wider">Tamaño</th>
                  <th className="px-6 py-3 text-right font-semibold text-surface-500 text-xs uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {stats.tablas.map((t, i) => (
                  <tr key={i} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-700">{t.tabla || t.TABLE_NAME}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{fmtRows(t.filas ?? t.TABLE_ROWS ?? 0)}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{fmtMB(t.tamano_kb / 1024 || 0)}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                        <FiCheck size={11} /> OK
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Grid: Backup + Restaurar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── BACKUP ── */}
        <ActionCard
          icon={<FiDownload size={24} />}
          title="Copia de Seguridad"
          subtitle="Descarga un archivo .sql con toda la base de datos"
          color="primary"
          badge="Recomendado"
        >
          <div className="space-y-4">
            <InfoBox icon={<FiInfo size={14} />} color="blue">
              El archivo incluye la estructura completa y todos los datos actuales del sistema.
              Guárdalo en un lugar seguro.
            </InfoBox>
            <div className="flex gap-3 flex-wrap text-xs text-surface-400">
              <span className="flex items-center gap-1"><FiClock size={12} /> Proceso rápido</span>
              <span className="flex items-center gap-1"><FiShield size={12} /> Incluye todos los datos</span>
              <span className="flex items-center gap-1"><FiDatabase size={12} /> Formato SQL estándar</span>
            </div>
            <button
              onClick={handleBackup}
              disabled={loadingBackup}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loadingBackup
                ? <><FiRefreshCw size={16} className="animate-spin" /> Generando...</>
                : <><FiDownload size={16} /> Descargar Backup</>}
            </button>
          </div>
        </ActionCard>

        {/* ── RESTAURAR ── */}
        <ActionCard
          icon={<FiUpload size={24} />}
          title="Restaurar Sistema"
          subtitle="Importa un archivo .sql para restaurar los datos"
          color="dental"
        >
          <div className="space-y-4">
            <InfoBox icon={<FiAlertTriangle size={14} />} color="yellow">
              <strong>Advertencia:</strong> Esto reemplazará TODOS los datos actuales con los del archivo.
              Esta acción no se puede deshacer.
            </InfoBox>

            {/* File picker */}
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all
                ${archivoSql
                  ? 'border-dental-400 bg-dental-50'
                  : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'
                }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".sql"
                className="hidden"
                onChange={e => setArchivoSql(e.target.files[0] || null)}
              />
              {archivoSql ? (
                <div>
                  <FiCheck size={20} className="mx-auto text-dental-500 mb-1" />
                  <p className="text-sm font-semibold text-dental-700">{archivoSql.name}</p>
                  <p className="text-xs text-surface-400">{(archivoSql.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <FiUpload size={20} className="mx-auto text-surface-400 mb-1" />
                  <p className="text-sm text-surface-500">Haz clic para seleccionar un archivo <strong>.sql</strong></p>
                </div>
              )}
            </div>

            {progRestore && (
              <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-dental h-2 rounded-full animate-pulse w-3/4" />
              </div>
            )}

            <button
              onClick={handleRestore}
              disabled={!archivoSql || loadingRestore}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40"
            >
              {loadingRestore
                ? <><FiRefreshCw size={16} className="animate-spin" /> Restaurando...</>
                : <><FiUpload size={16} /> Restaurar Ahora</>}
            </button>
          </div>
        </ActionCard>
      </div>

      {/* ── RESET ── */}
      <div className="bg-white rounded-2xl shadow-card border border-red-100 overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <FiAlertTriangle size={22} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-base">Resetear Sistema para Nueva Empresa</h2>
              <p className="text-sm text-surface-400 mt-0.5">
                Elimina todos los datos clínicos (pacientes, citas, tratamientos…) y deja el sistema listo para una nueva organización.
                Los usuarios y la configuración se conservan.
              </p>
            </div>
          </div>
          {!showReset && (
            <button
              onClick={() => setShowReset(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm whitespace-nowrap"
            >
              <FiRefreshCw size={15} />
              Iniciar Reset
            </button>
          )}
        </div>

        {showReset && (
          <div className="border-t border-red-100 px-6 py-5 bg-red-50 space-y-4">
            <InfoBox icon={<FiAlertTriangle size={14} />} color="red">
              <strong>¡ATENCIÓN!</strong> Se eliminarán permanentemente: pacientes, citas, tratamientos, presupuestos, pagos, historias clínicas, odontogramas y consentimientos. <strong>Esta acción es irreversible.</strong>
            </InfoBox>
            <p className="text-sm font-semibold text-gray-700">
              Para confirmar, escribe exactamente: <code className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-mono">RESET SISTEMA</code>
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Escribe: RESET SISTEMA"
              className="input-field border-red-200 focus:ring-red-300 focus:border-red-400"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowReset(false); setConfirmText(''); }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={confirmText !== 'RESET SISTEMA' || loadingReset}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {loadingReset
                  ? <><FiRefreshCw size={14} className="animate-spin" /> Procesando...</>
                  : <><FiAlertTriangle size={14} /> Confirmar Reset</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Sub-componentes
────────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, loading }) {
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    dental:  'from-dental-500 to-dental-600',
    accent:  'from-accent-500 to-accent-600',
  };
  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[color]} text-white flex items-center justify-center flex-shrink-0 shadow-md`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-surface-400 uppercase tracking-wider font-semibold">{label}</p>
        {loading
          ? <div className="h-6 w-20 bg-surface-100 animate-pulse rounded-lg mt-1" />
          : <p className="text-xl font-extrabold text-gray-800 mt-0.5">{value}</p>
        }
      </div>
    </div>
  );
}

function ActionCard({ icon, title, subtitle, color, badge, children }) {
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    dental:  'from-dental-500 to-dental-600',
  };
  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
      <div className={`bg-gradient-to-r ${colors[color]} p-5 flex items-center gap-4`}>
        <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-sm">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white text-base">{title}</h2>
            {badge && (
              <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoBox({ icon, color, children }) {
  const styles = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red:    'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`flex gap-2 p-3 border rounded-xl text-xs leading-relaxed ${styles[color]}`}>
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

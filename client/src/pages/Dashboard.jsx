import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiUsers, FiCalendar, FiClock, FiDollarSign, FiTrendingUp, FiChevronRight } from 'react-icons/fi';

function GaugeChart({ value, max, label, unit, color = 'primary', size = 140 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const r = (size - 20) / 2;
  const circumference = 2 * Math.PI * r * 0.75; // 270 degrees
  const offset = circumference - (pct / 100) * circumference;
  const colors = {
    primary: { stroke: '#2196f3', bg: '#e3f2fd', text: '#1565c0' },
    teal: { stroke: '#14b8a6', bg: '#ccfbf1', text: '#0f766e' },
    accent: { stroke: '#f97316', bg: '#ffedd5', text: '#c2410c' },
    purple: { stroke: '#8b5cf6', bg: '#ede9fe', text: '#6d28d9' },
  };
  const c = colors[color] || colors.primary;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.8} viewBox={`0 0 ${size} ${size * 0.85}`}>
        {/* Background arc */}
        <circle
          cx={size / 2} cy={size / 2}
          r={r}
          fill="none"
          stroke={c.bg}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${2 * Math.PI * r}`}
          transform={`rotate(135, ${size / 2}, ${size / 2})`}
        />
        {/* Value arc */}
        <circle
          cx={size / 2} cy={size / 2}
          r={r}
          fill="none"
          stroke={c.stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${2 * Math.PI * r}`}
          strokeDashoffset={offset}
          transform={`rotate(135, ${size / 2}, ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        {/* Center text */}
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize="24" fontWeight="800" fill={c.text}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </text>
        <text x={size / 2} y={size / 2 + 16} textAnchor="middle" fontSize="11" fill="#94a3b8">
          {unit}
        </text>
      </svg>
      <p className="text-sm font-semibold text-gray-700 -mt-1">{label}</p>
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex-1">
      <div className="text-center mb-2">
        <p className="text-lg font-bold" style={{ color }}>{value}</p>
        <p className="text-[10px] text-surface-400 uppercase tracking-wider">{label}</p>
      </div>
      <div className="w-full bg-surface-100 rounded-full h-16 flex flex-col justify-end overflow-hidden">
        <div className="rounded-full transition-all duration-700" style={{ height: `${Math.max(pct, 8)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
  if (!data) return <div className="text-center py-10 text-surface-400">Error al cargar datos</div>;

  const { estadisticas, proximasCitas, pacientesRecientes, presupuestosPendientes, doctorStats } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-900">Dashboard</h1>
          <p className="text-sm text-surface-400">Resumen general de la clínica</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-surface-500">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pacientes', value: estadisticas.totalPacientes, icon: FiUsers, gradient: 'from-primary-600 to-primary-400', iconBg: 'bg-primary-500' },
          { label: 'Citas Hoy', value: estadisticas.citasHoy, icon: FiCalendar, gradient: 'from-dental-600 to-dental-400', iconBg: 'bg-dental-500' },
          { label: 'Pendientes', value: estadisticas.citasPendientes, icon: FiClock, gradient: 'from-accent-600 to-accent-400', iconBg: 'bg-accent-500' },
          { label: 'Ingresos Mes', value: `$${Number(estadisticas.ingresosMes).toLocaleString()}`, icon: FiDollarSign, gradient: 'from-purple-600 to-purple-400', iconBg: 'bg-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
              <p className="text-xs text-surface-400 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gauges Row - like the reference image */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex flex-col items-center">
          <h3 className="font-bold text-gray-800 mb-2 self-start">Citas Hoy</h3>
          <GaugeChart value={estadisticas.citasHoy} max={Math.max(estadisticas.citasHoy, 10)} label="Total del día" unit="citas" color="primary" />
        </div>
        <div className="card flex flex-col items-center">
          <h3 className="font-bold text-gray-800 mb-2 self-start">Tasa Pendientes</h3>
          <GaugeChart
            value={estadisticas.citasHoy > 0 ? Math.round((estadisticas.citasPendientes / estadisticas.citasHoy) * 100) : 0}
            max={100}
            label="Por atender"
            unit="%"
            color="accent"
          />
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Actividad Mes</h3>
          <div className="flex gap-3 items-end px-2">
            <MiniBar label="Pacientes" value={estadisticas.totalPacientes} max={Math.max(estadisticas.totalPacientes, 20)} color="#2196f3" />
            <MiniBar label="Citas" value={estadisticas.citasHoy} max={Math.max(estadisticas.citasHoy, 10)} color="#f97316" />
            <MiniBar label="Pendientes" value={estadisticas.citasPendientes} max={Math.max(estadisticas.citasPendientes, 10)} color="#14b8a6" />
          </div>
        </div>
      </div>

      {/* Doctor Stats */}
      {doctorStats?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Rendimiento por Doctor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {doctorStats.map(doc => (
              <div key={doc.id} className="card-flat hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-dental flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {doc.nombre.split(' ')[1]?.[0]}{doc.nombre.split(' ')[2]?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{doc.nombre}</p>
                    <p className="text-xs text-surface-400">{doc.especialidad}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-surface-400">Citas</span>
                    <span className="font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg">{doc.citasMes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-surface-400">Completadas</span>
                    <span className="font-bold text-dental-600 bg-dental-50 px-2 py-0.5 rounded-lg">{doc.citasCompletadas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-surface-400">Ingresos</span>
                    <span className="font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-lg">${Number(doc.ingresos).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas citas */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Próximas Citas</h2>
            <Link to="/citas" className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
              Ver todas <FiChevronRight size={14} />
            </Link>
          </div>
          {proximasCitas.length === 0 ? (
            <p className="text-surface-400 text-sm py-4 text-center">No hay citas programadas</p>
          ) : (
            <div className="space-y-2">
              {proximasCitas.map(cita => (
                <div key={cita.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-2xl hover:bg-primary-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">
                      {cita.paciente?.nombre?.[0]}{cita.paciente?.apellido?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {cita.paciente?.nombre} {cita.paciente?.apellido}
                      </p>
                      <p className="text-xs text-surface-400">
                        Dr. {cita.doctor?.apellido} - {cita.motivo || 'Consulta'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary-600">{cita.fecha}</p>
                    <p className="text-xs text-surface-400">{cita.hora_inicio?.slice(0,5)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pacientes recientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Pacientes Recientes</h2>
            <Link to="/pacientes" className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
              Ver todos <FiChevronRight size={14} />
            </Link>
          </div>
          {pacientesRecientes.length === 0 ? (
            <p className="text-surface-400 text-sm py-4 text-center">No hay pacientes registrados</p>
          ) : (
            <div className="space-y-2">
              {pacientesRecientes.map(pac => (
                <Link key={pac.id} to={`/pacientes/${pac.id}`} className="flex items-center gap-3 p-3 bg-surface-50 rounded-2xl hover:bg-dental-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-teal flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {pac.nombre[0]}{pac.apellido[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{pac.apellido}, {pac.nombre}</p>
                    <p className="text-xs text-surface-400">DNI: {pac.dni}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Presupuestos pendientes */}
      {presupuestosPendientes.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Presupuestos Pendientes</h2>
            <Link to="/presupuestos" className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
              Ver todos <FiChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Total</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {presupuestosPendientes.map(p => (
                  <tr key={p.id}>
                    <td className="font-semibold text-gray-900">{p.paciente?.nombre} {p.paciente?.apellido}</td>
                    <td className="font-bold text-dental-600">${Number(p.total).toLocaleString()}</td>
                    <td className="text-surface-400">{p.createdAt?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

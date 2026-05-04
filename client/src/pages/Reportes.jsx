import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiDollarSign, FiCalendar, FiTrendingUp, FiAlertCircle, FiMessageCircle, FiDownload } from 'react-icons/fi';

const HOY = new Date();
const INICIO_MES = new Date(HOY.getFullYear(), HOY.getMonth(), 1).toISOString().split('T')[0];
const FIN_MES = new Date(HOY.getFullYear(), HOY.getMonth() + 1, 0).toISOString().split('T')[0];

export default function Reportes() {
  const [tab, setTab] = useState('ingresos');
  const [desde, setDesde] = useState(INICIO_MES);
  const [hasta, setHasta] = useState(FIN_MES);
  const [dataIngresos, setDataIngresos] = useState(null);
  const [dataCitas, setDataCitas] = useState(null);
  const [dataTratamientos, setDataTratamientos] = useState(null);
  const [dataDeudas, setDataDeudas] = useState(null);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      if (tab === 'ingresos') {
        const { data } = await api.get('/reportes/ingresos', { params: { desde, hasta } });
        setDataIngresos(data);
      } else if (tab === 'citas') {
        const { data } = await api.get('/reportes/citas', { params: { desde, hasta } });
        setDataCitas(data);
      } else if (tab === 'tratamientos') {
        const { data } = await api.get('/reportes/tratamientos-populares', { params: { desde, hasta } });
        setDataTratamientos(data);
      } else if (tab === 'deudas') {
        const { data } = await api.get('/reportes/pacientes-deuda');
        setDataDeudas(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [tab, desde, hasta]);

  const tabs = [
    { key: 'ingresos', label: 'Ingresos', icon: FiDollarSign },
    { key: 'citas', label: 'Citas', icon: FiCalendar },
    { key: 'tratamientos', label: 'Tratamientos', icon: FiTrendingUp },
    { key: 'deudas', label: 'Deudas', icon: FiAlertCircle },
  ];

  const METODO_LABELS = {
    efectivo: 'Efectivo',
    tarjeta_debito: 'Tarjeta Débito',
    tarjeta_credito: 'Tarjeta Crédito',
    transferencia: 'Transferencia'
  };

  const ESTADO_CITA_LABELS = {
    programada: 'Programada',
    confirmada: 'Confirmada',
    en_curso: 'En curso',
    completada: 'Completada',
    cancelada: 'Cancelada',
    no_asistio: 'No asistió'
  };

  const maxIngreso = dataIngresos?.ingresos?.length
    ? Math.max(...dataIngresos.ingresos.map(i => parseFloat(i.total)))
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-800">Reportes</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-primary-700 shadow-md' : 'text-surface-500 hover:text-primary-600'}`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtro de fechas */}
      {tab !== 'deudas' && (
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-surface-500 mb-1">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="input-field w-auto" />
          </div>
          <div>
            <label className="block text-xs text-surface-500 mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="input-field w-auto" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setDesde(INICIO_MES); setHasta(FIN_MES); }} className="btn-secondary text-sm">Este mes</button>
            <button onClick={() => {
              const d = new Date(HOY.getFullYear(), HOY.getMonth() - 1, 1);
              const h = new Date(HOY.getFullYear(), HOY.getMonth(), 0);
              setDesde(d.toISOString().split('T')[0]); setHasta(h.toISOString().split('T')[0]);
            }} className="btn-secondary text-sm">Mes anterior</button>
            <button onClick={() => {
              const q = Math.floor(HOY.getMonth() / 3) * 3;
              const d = new Date(HOY.getFullYear(), q, 1).toISOString().split('T')[0];
              const h = new Date(HOY.getFullYear(), q + 3, 0).toISOString().split('T')[0];
              setDesde(d); setHasta(h);
            }} className="btn-secondary text-sm">Trimestre</button>
            <button onClick={() => {
              const d = new Date(HOY.getFullYear(), 0, 1).toISOString().split('T')[0];
              const h = new Date(HOY.getFullYear(), 11, 31).toISOString().split('T')[0];
              setDesde(d); setHasta(h);
            }} className="btn-secondary text-sm">Este año</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando reporte...</div>
      ) : (
        <>
          {/* TAB INGRESOS */}
          {tab === 'ingresos' && dataIngresos && (
            <div className="space-y-6">
              {/* Total */}
              <div className="card-gradient bg-gradient-to-r from-dental-500 to-dental-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dental-100 text-sm">Ingresos totales del período</p>
                    <p className="text-4xl font-bold mt-1">${Number(dataIngresos.totalGeneral).toLocaleString()}</p>
                    <p className="text-dental-100 text-sm mt-1">{dataIngresos.ingresos.length} días con ingresos</p>
                  </div>
                  <a
                    href={`/api/exportar/pagos?desde=${desde}&hasta=${hasta}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiDownload size={14} /> Exportar
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de barras simple */}
                <div className="card">
                  <h3 className="font-semibold text-primary-900 mb-4">Ingresos por día</h3>
                  {dataIngresos.ingresos.length === 0 ? (
                    <p className="text-gray-500 text-sm">Sin datos para el período seleccionado</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {dataIngresos.ingresos.map((ing, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-24 shrink-0">{ing.periodo}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                            <div
                              className="bg-green-500 h-full rounded-full flex items-center justify-end px-2"
                              style={{ width: `${maxIngreso > 0 ? (parseFloat(ing.total) / maxIngreso) * 100 : 0}%`, minWidth: '40px' }}
                            >
                              <span className="text-[10px] text-white font-medium">${Number(ing.total).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Por método de pago */}
                <div className="card">
                  <h3 className="font-semibold text-primary-900 mb-4">Por método de pago</h3>
                  {dataIngresos.porMetodo.length === 0 ? (
                    <p className="text-gray-500 text-sm">Sin datos</p>
                  ) : (
                    <div className="space-y-4">
                      {dataIngresos.porMetodo.map((m, i) => {
                        const pct = dataIngresos.totalGeneral > 0
                          ? ((parseFloat(m.total) / dataIngresos.totalGeneral) * 100).toFixed(1)
                          : 0;
                        const colores = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'];
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{METODO_LABELS[m.metodo_pago] || m.metodo_pago}</span>
                              <span className="font-medium">${Number(m.total).toLocaleString()} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3">
                              <div className={`${colores[i % colores.length]} h-full rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CITAS */}
          {tab === 'citas' && dataCitas && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="stat-card justify-center flex-col text-center">
                  <p className="text-3xl font-bold text-primary-700">{dataCitas.totalCitas}</p>
                  <p className="text-sm text-surface-500">Total de citas</p>
                </div>
                <div className="stat-card justify-center flex-col text-center">
                  <p className="text-3xl font-bold text-dental-600">{dataCitas.tasaAsistencia}%</p>
                  <p className="text-sm text-surface-500">Tasa de asistencia</p>
                </div>
                <div className="stat-card justify-center flex-col text-center">
                  <p className="text-3xl font-bold text-red-500">{dataCitas.noAsistieron}</p>
                  <p className="text-sm text-surface-500">No asistieron</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-semibold text-primary-900 mb-4">Por estado</h3>
                  <div className="space-y-3">
                    {dataCitas.porEstado.map((e, i) => {
                      const colores = {
                        programada: 'bg-blue-500', confirmada: 'bg-indigo-500',
                        en_curso: 'bg-yellow-500', completada: 'bg-green-500',
                        cancelada: 'bg-red-500', no_asistio: 'bg-gray-500'
                      };
                      const pct = dataCitas.totalCitas > 0 ? ((parseInt(e.cantidad) / dataCitas.totalCitas) * 100).toFixed(1) : 0;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full ${colores[e.estado] || 'bg-gray-400'}`} />
                          <span className="text-sm text-gray-700 flex-1">{ESTADO_CITA_LABELS[e.estado] || e.estado}</span>
                          <span className="text-sm font-medium">{e.cantidad}</span>
                          <span className="text-xs text-gray-400 w-12 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-primary-900 mb-4">Por doctor</h3>
                  <div className="space-y-3">
                    {dataCitas.porDoctor.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">Dr. {d['doctor.nombre']} {d['doctor.apellido']}</span>
                        <span className="badge bg-primary-100 text-primary-700">{d.cantidad} citas</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB TRATAMIENTOS */}
          {tab === 'tratamientos' && dataTratamientos && (
            <div className="card">
              <h3 className="font-semibold text-primary-900 mb-4">Tratamientos más solicitados</h3>
              {dataTratamientos.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin datos para el período</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Tratamiento</th>
                        <th className="text-center">Cantidad</th>
                        <th className="text-right">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataTratamientos.map((t, i) => (
                        <tr key={i}>
                          <td className="text-surface-400 font-medium">{i + 1}</td>
                          <td className="font-semibold text-primary-900">{t['tratamiento.nombre']}</td>
                          <td className="text-center">
                            <span className="badge bg-primary-100 text-primary-700">{t.cantidad}</span>
                          </td>
                          <td className="text-right font-semibold text-dental-600">${Number(t.ingresos).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB DEUDAS */}
          {tab === 'deudas' && dataDeudas && (
            <div className="space-y-4">
              <div className="card-gradient bg-gradient-to-r from-red-500 to-red-600">
                <p className="text-red-100 text-sm">Total deuda pendiente</p>
                <p className="text-4xl font-bold mt-1">
                  ${dataDeudas.reduce((s, d) => s + d.deuda, 0).toLocaleString()}
                </p>
                <p className="text-red-100 text-sm mt-1">{dataDeudas.length} pacientes con deuda</p>
              </div>

              <div className="card overflow-x-auto p-0">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>DNI</th>
                      <th>Teléfono</th>
                      <th className="text-right">Presupuestado</th>
                      <th className="text-right">Pagado</th>
                      <th className="text-right">Deuda</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataDeudas.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-surface-400">No hay pacientes con deuda</td></tr>
                    ) : dataDeudas.map(d => (
                      <tr key={d.id}>
                        <td>
                          <Link to={`/pacientes/${d.id}`} className="font-medium text-primary-600 hover:underline">
                            {d.apellido}, {d.nombre}
                          </Link>
                        </td>
                        <td className="text-surface-600">{d.dni}</td>
                        <td className="text-surface-600">{d.telefono || '-'}</td>
                        <td className="text-right">${Number(d.totalPresupuestos).toLocaleString()}</td>
                        <td className="text-right text-dental-600">${Number(d.totalPagado).toLocaleString()}</td>
                        <td className="text-right font-bold text-red-600">${Number(d.deuda).toLocaleString()}</td>
                        <td>
                          {d.telefono && (
                            <button
                              onClick={() => {
                                const tel = d.telefono.replace(/\D/g, '');
                                const msg = encodeURIComponent(
                                  `Hola ${d.nombre}, le informamos que tiene un saldo pendiente de $${Number(d.deuda).toLocaleString()} en nuestra clínica odontológica. Puede comunicarse para coordinar su pago. ¡Gracias!`
                                );
                                window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Enviar recordatorio WhatsApp"
                            >
                              <FiMessageCircle size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

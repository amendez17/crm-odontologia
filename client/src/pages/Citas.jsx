import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight,
  FiList, FiGrid, FiFilter, FiMessageCircle, FiCalendar
} from 'react-icons/fi';

const ESTADOS = {
  programada:  { cls: 'bg-blue-100 text-blue-700',   label: 'Programada' },
  confirmada:  { cls: 'bg-indigo-100 text-indigo-700', label: 'Confirmada' },
  en_curso:    { cls: 'bg-yellow-100 text-yellow-700', label: 'En curso' },
  completada:  { cls: 'bg-green-100 text-green-700',  label: 'Completada' },
  cancelada:   { cls: 'bg-red-100 text-red-700',      label: 'Cancelada' },
  no_asistio:  { cls: 'bg-gray-100 text-gray-700',    label: 'No asistió' },
};

const DOCTOR_COLORS = [
  { bg: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-l-blue-500'   },
  { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-800', border: 'border-l-purple-500' },
  { bg: 'bg-teal-500',   light: 'bg-teal-50',   text: 'text-teal-800',   border: 'border-l-teal-500'   },
  { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-800', border: 'border-l-orange-500' },
  { bg: 'bg-pink-500',   light: 'bg-pink-50',   text: 'text-pink-800',   border: 'border-l-pink-500'   },
  { bg: 'bg-green-600',  light: 'bg-green-50',  text: 'text-green-800',  border: 'border-l-green-600'  },
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const HORAS = Array.from({ length: 13 }, (_, i) => i + 7); // 7:00 – 19:00
const ALTURA_HORA = 60; // px por hora

function getLunesDeSemana(fecha) {
  const d = new Date(fecha + 'T12:00:00');
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(d);
  lunes.setDate(d.getDate() + diff);
  return lunes;
}

function getDiasSemana(fecha) {
  const lunes = getLunesDeSemana(fecha);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function getMesGrid(fecha) {
  const d = new Date(fecha + 'T12:00:00');
  const año = d.getFullYear();
  const mes = d.getMonth();
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  let inicioGrid = primerDia.getDay();
  inicioGrid = inicioGrid === 0 ? 6 : inicioGrid - 1; // lunes = 0
  const dias = [];
  for (let i = inicioGrid; i > 0; i--) {
    dias.push({ fecha: new Date(año, mes, 1 - i).toISOString().split('T')[0], mesActual: false });
  }
  for (let i = 1; i <= ultimoDia.getDate(); i++) {
    dias.push({ fecha: new Date(año, mes, i).toISOString().split('T')[0], mesActual: true });
  }
  let ext = 1;
  while (dias.length % 7 !== 0) {
    dias.push({ fecha: new Date(año, mes + 1, ext++).toISOString().split('T')[0], mesActual: false });
  }
  return dias;
}

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function Citas() {
  const [citas, setCitas]           = useState([]);
  const [citasSemana, setCitasSemana] = useState({});
  const [citasMes, setCitasMes]     = useState({});
  const [doctores, setDoctores]     = useState([]);
  const [pacientes, setPacientes]   = useState([]);
  const [fecha, setFecha]           = useState(new Date().toISOString().split('T')[0]);
  const [vista, setVista]           = useState('semana');
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [editando, setEditando]     = useState(null);
  const [form, setForm]             = useState({ paciente_id: '', doctor_id: '', fecha: '', hora_inicio: '', hora_fin: '', motivo: '', estado: 'programada', notas: '' });
  const [filtroDoctor, setFiltroDoctor] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showFiltros, setShowFiltros]   = useState(false);
  const [dragInfo, setDragInfo]     = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  // Mapa doctor_id → color
  const doctorColorMap = {};
  doctores.forEach((d, i) => { doctorColorMap[d.id] = DOCTOR_COLORS[i % DOCTOR_COLORS.length]; });

  // ── Carga de datos ──────────────────────────────────────────────────────────

  const cargarDia = async () => {
    setLoading(true);
    try {
      const params = { fecha };
      if (filtroDoctor) params.doctor_id = filtroDoctor;
      if (filtroEstado) params.estado = filtroEstado;
      const { data } = await api.get('/citas', { params });
      setCitas(data.sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || '')));
    } catch { toast.error('Error al cargar citas'); }
    finally { setLoading(false); }
  };

  const cargarSemana = async () => {
    setLoading(true);
    try {
      const dias = getDiasSemana(fecha);
      const params = { desde: dias[0], hasta: dias[6] };
      if (filtroDoctor) params.doctor_id = filtroDoctor;
      if (filtroEstado) params.estado = filtroEstado;
      const { data } = await api.get('/citas', { params });
      const agrupado = {};
      dias.forEach(d => { agrupado[d] = []; });
      data.forEach(c => { if (agrupado[c.fecha]) agrupado[c.fecha].push(c); });
      Object.keys(agrupado).forEach(d => agrupado[d].sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || '')));
      setCitasSemana(agrupado);
    } catch { toast.error('Error al cargar citas'); }
    finally { setLoading(false); }
  };

  const cargarMes = async () => {
    setLoading(true);
    try {
      const d = new Date(fecha + 'T12:00:00');
      const desde = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const hasta  = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const params = { desde, hasta };
      if (filtroDoctor) params.doctor_id = filtroDoctor;
      if (filtroEstado) params.estado = filtroEstado;
      const { data } = await api.get('/citas', { params });
      const agrupado = {};
      data.forEach(c => {
        if (!agrupado[c.fecha]) agrupado[c.fecha] = [];
        agrupado[c.fecha].push(c);
      });
      Object.keys(agrupado).forEach(d => agrupado[d].sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || '')));
      setCitasMes(agrupado);
    } catch { toast.error('Error al cargar citas'); }
    finally { setLoading(false); }
  };

  const cargarDatos = async () => {
    try {
      const [docRes, pacRes] = await Promise.all([
        api.get('/usuarios/doctores'),
        api.get('/pacientes', { params: { limit: 1000 } })
      ]);
      setDoctores(docRes.data);
      setPacientes(pacRes.data.pacientes || []);
    } catch {}
  };

  const cargar = () => {
    if (vista === 'dia') cargarDia();
    else if (vista === 'semana') cargarSemana();
    else cargarMes();
  };

  useEffect(() => { cargar(); }, [fecha, vista, filtroDoctor, filtroEstado]);
  useEffect(() => { cargarDatos(); }, []);

  // ── Navegación ──────────────────────────────────────────────────────────────

  const cambiarPeriodo = (dir) => {
    const d = new Date(fecha + 'T12:00:00');
    if (vista === 'dia')    d.setDate(d.getDate() + dir);
    else if (vista === 'semana') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setFecha(d.toISOString().split('T')[0]);
  };

  const formatFecha      = (f) => new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatFechaCorta = (f) => new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  const getNombreMes     = ()  => { const d = new Date(fecha + 'T12:00:00'); return `${MESES[d.getMonth()]} ${d.getFullYear()}`; };

  const getPeriodoLabel = () => {
    if (vista === 'dia')    return formatFecha(fecha);
    if (vista === 'semana') return `${formatFechaCorta(diasSemana[0])} — ${formatFechaCorta(diasSemana[6])}`;
    return getNombreMes();
  };

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const abrirNuevo = (fechaPrefill, horaPrefill) => {
    setForm({ paciente_id: '', doctor_id: '', fecha: fechaPrefill || fecha, hora_inicio: horaPrefill || '', hora_fin: '', motivo: '', estado: 'programada', notas: '' });
    setEditando(null);
    setModal(true);
  };

  const abrirEditar = (cita) => {
    setForm({
      paciente_id: cita.paciente_id, doctor_id: cita.doctor_id, fecha: cita.fecha,
      hora_inicio: cita.hora_inicio?.slice(0, 5) || '',
      hora_fin:    cita.hora_fin?.slice(0, 5) || '',
      motivo: cita.motivo || '', estado: cita.estado, notas: cita.notas || ''
    });
    setEditando(cita.id);
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (editando) { await api.put(`/citas/${editando}`, form); toast.success('Cita actualizada'); }
      else          { await api.post('/citas', form);            toast.success('Cita creada'); }
      setModal(false);
      cargar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta cita?')) return;
    try { await api.delete(`/citas/${id}`); toast.success('Cita eliminada'); cargar(); }
    catch { toast.error('Error al eliminar'); }
  };

  const cambiarEstado = async (id, estado) => {
    try { await api.put(`/citas/${id}`, { estado }); cargar(); }
    catch { toast.error('Error al cambiar estado'); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviarWhatsApp = (cita) => {
    const tel = cita.paciente?.telefono?.replace(/\D/g, '') || '';
    if (!tel) { toast.error('El paciente no tiene teléfono registrado'); return; }
    const fechaFmt = new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const msg = encodeURIComponent(
      `Hola ${cita.paciente?.nombre}, le recordamos su cita odontológica:\n` +
      `📅 ${fechaFmt}\n🕐 ${cita.hora_inicio?.slice(0, 5)} hs\n` +
      `👨‍⚕️ Dr. ${cita.doctor?.nombre} ${cita.doctor?.apellido}\n` +
      `${cita.motivo ? `📋 Motivo: ${cita.motivo}\n` : ''}` +
      `\nPor favor confirme su asistencia. ¡Gracias!`
    );
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  const handleDragStart = (e, cita) => {
    setDragInfo({ cita });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, dia, hora = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ fecha: dia, hora });
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(null);
  };

  const handleDrop = async (e, nuevaFecha, nuevaHora = null) => {
    e.preventDefault();
    setDropTarget(null);
    if (!dragInfo) return;
    const { cita } = dragInfo;
    setDragInfo(null);
    const mismaFecha = cita.fecha === nuevaFecha;
    const mismaHora  = !nuevaHora || nuevaHora === cita.hora_inicio?.slice(0, 5);
    if (mismaFecha && mismaHora) return;
    try {
      const updates = { fecha: nuevaFecha };
      if (nuevaHora) {
        updates.hora_inicio = nuevaHora + ':00';
        if (cita.hora_inicio && cita.hora_fin) {
          const dur = timeToMinutes(cita.hora_fin.slice(0, 5)) - timeToMinutes(cita.hora_inicio.slice(0, 5));
          if (dur > 0) {
            const [h, m] = nuevaHora.split(':').map(Number);
            const finMin = h * 60 + m + dur;
            updates.hora_fin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}:00`;
          }
        }
      }
      await api.put(`/citas/${cita.id}`, updates);
      toast.success('Cita reprogramada');
      cargar();
    } catch { toast.error('Error al reprogramar la cita'); }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderCitaChip = (cita) => {
    const color = doctorColorMap[cita.doctor_id] || DOCTOR_COLORS[0];
    const dragging = dragInfo?.cita?.id === cita.id;
    return (
      <div
        key={cita.id}
        draggable
        onDragStart={(e) => handleDragStart(e, cita)}
        className={`rounded-lg border-l-4 ${color.light} ${color.border} px-2 py-1.5 cursor-grab active:cursor-grabbing select-none transition-all ${dragging ? 'opacity-30' : 'hover:shadow-sm'}`}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className={`font-bold text-xs ${color.text}`}>{cita.hora_inicio?.slice(0, 5)}</p>
            <p className="text-xs text-gray-800 font-medium truncate">{cita.paciente?.apellido}, {cita.paciente?.nombre?.charAt(0)}.</p>
            <p className="text-[10px] text-gray-500 truncate">{cita.motivo || `Dr. ${cita.doctor?.apellido}`}</p>
          </div>
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); enviarWhatsApp(cita); }} className="p-0.5 text-green-600 hover:bg-green-100 rounded" title="WhatsApp"><FiMessageCircle size={11} /></button>
            <button onClick={(e) => { e.stopPropagation(); abrirEditar(cita); }} className="p-0.5 text-yellow-600 hover:bg-yellow-100 rounded"><FiEdit2 size={11} /></button>
            <button onClick={(e) => { e.stopPropagation(); eliminar(cita.id); }} className="p-0.5 text-red-600 hover:bg-red-100 rounded"><FiTrash2 size={11} /></button>
          </div>
        </div>
        <select
          value={cita.estado}
          onChange={(e) => { e.stopPropagation(); cambiarEstado(cita.id, e.target.value); }}
          onClick={(e) => e.stopPropagation()}
          className={`mt-1 w-full text-[10px] rounded px-1 border-0 cursor-pointer ${ESTADOS[cita.estado]?.cls || ''}`}
        >
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
    );
  };

  const renderCitaCard = (cita) => {
    const color = doctorColorMap[cita.doctor_id] || DOCTOR_COLORS[0];
    return (
      <div key={cita.id} className={`card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 ${color.border}`}>
        <div className="flex items-center gap-4">
          <div className={`text-center min-w-[60px] ${color.light} rounded-xl px-3 py-2`}>
            <p className={`text-lg font-bold ${color.text}`}>{cita.hora_inicio?.slice(0, 5)}</p>
            {cita.hora_fin && <p className="text-xs text-surface-400">{cita.hora_fin?.slice(0, 5)}</p>}
          </div>
          <div>
            <p className="font-semibold text-primary-900">{cita.paciente?.nombre} {cita.paciente?.apellido}</p>
            <p className="text-sm text-surface-500">Dr. {cita.doctor?.nombre} {cita.doctor?.apellido}</p>
            {cita.motivo && <p className="text-sm text-surface-400">{cita.motivo}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={cita.estado}
            onChange={(e) => cambiarEstado(cita.id, e.target.value)}
            className={`badge ${ESTADOS[cita.estado]?.cls} border-0 cursor-pointer text-xs pr-6`}
          >
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => enviarWhatsApp(cita)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="WhatsApp"><FiMessageCircle size={15} /></button>
          <button onClick={() => abrirEditar(cita)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"><FiEdit2 size={15} /></button>
          <button onClick={() => eliminar(cita.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 size={15} /></button>
        </div>
      </div>
    );
  };

  // ── Vista Semana (grilla horaria + DnD) ─────────────────────────────────────

  const renderVistaSemana = () => (
    <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card">
      {/* Cabecera días */}
      <div className="grid border-b border-surface-200 bg-surface-50 sticky top-0 z-10" style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}>
        <div className="border-r border-surface-200 p-2" />
        {diasSemana.map((dia, i) => {
          const esHoy = dia === hoy;
          const d = new Date(dia + 'T12:00:00');
          return (
            <div
              key={dia}
              onClick={() => { setFecha(dia); setVista('dia'); }}
              className={`p-2 text-center border-r border-surface-200 last:border-r-0 cursor-pointer hover:bg-primary-50 transition-colors ${esHoy ? 'bg-primary-50/60' : ''}`}
            >
              <p className="text-xs text-surface-500">{DIAS_SEMANA[i]}</p>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold mt-0.5 ${esHoy ? 'bg-primary-600 text-white' : 'text-surface-700 hover:bg-primary-100'}`}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      {/* Grilla horaria */}
      <div className="overflow-y-auto" style={{ maxHeight: '580px' }}>
        {HORAS.map(hora => {
          const horaStr = `${String(hora).padStart(2, '0')}:00`;
          return (
            <div
              key={hora}
              className="grid border-b border-surface-100"
              style={{ gridTemplateColumns: '64px repeat(7, 1fr)', minHeight: `${ALTURA_HORA}px` }}
            >
              <div className="border-r border-surface-200 flex items-start justify-end pr-2 pt-1.5 flex-shrink-0">
                <span className="text-xs text-surface-400">{horaStr}</span>
              </div>
              {diasSemana.map(dia => {
                const citasHora = (citasSemana[dia] || []).filter(c => {
                  if (!c.hora_inicio) return false;
                  return parseInt(c.hora_inicio.split(':')[0]) === hora;
                });
                const isTarget = dropTarget?.fecha === dia && dropTarget?.hora === horaStr;
                return (
                  <div
                    key={dia}
                    className={`border-r border-surface-100 last:border-r-0 p-0.5 space-y-0.5 transition-colors ${isTarget ? 'bg-primary-100 ring-1 ring-inset ring-primary-400' : 'hover:bg-surface-50/70'}`}
                    onDragOver={(e) => handleDragOver(e, dia, horaStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dia, horaStr)}
                    onClick={() => !citasHora.length && abrirNuevo(dia, horaStr)}
                  >
                    {citasHora.map(cita => renderCitaChip(cita))}
                    {isTarget && !citasHora.length && (
                      <div className="text-[10px] text-primary-500 text-center py-2 border-2 border-dashed border-primary-300 rounded-lg">
                        Soltar aquí
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Vista Día (grilla horaria + DnD) ─────────────────────────────────────────

  const renderVistaDia = () => {
    const citasConHora = citas.filter(c => {
      if (!c.hora_inicio) return false;
      const h = parseInt(c.hora_inicio.split(':')[0]);
      return h >= HORAS[0] && h <= HORAS[HORAS.length - 1];
    });
    const citasSinHora = citas.filter(c => !c.hora_inicio);

    return (
      <>
        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card">
          <div className="overflow-y-auto" style={{ maxHeight: '580px' }}>
            {HORAS.map(hora => {
              const horaStr = `${String(hora).padStart(2, '0')}:00`;
              const citasHora = citasConHora.filter(c => parseInt(c.hora_inicio.split(':')[0]) === hora);
              const isTarget = dropTarget?.fecha === fecha && dropTarget?.hora === horaStr;
              return (
                <div
                  key={hora}
                  className={`flex border-b border-surface-100 transition-colors ${isTarget ? 'bg-primary-50' : ''}`}
                  style={{ minHeight: `${ALTURA_HORA}px` }}
                  onDragOver={(e) => handleDragOver(e, fecha, horaStr)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, fecha, horaStr)}
                  onClick={() => !citasHora.length && abrirNuevo(fecha, horaStr)}
                >
                  <div className="w-16 flex-shrink-0 border-r border-surface-200 flex items-start justify-end pr-2 pt-1.5">
                    <span className="text-xs text-surface-400">{horaStr}</span>
                  </div>
                  <div className="flex-1 p-1 space-y-1">
                    {citasHora.map(cita => renderCitaChip(cita))}
                    {isTarget && !citasHora.length && (
                      <div className="text-xs text-primary-500 text-center py-2 border-2 border-dashed border-primary-300 rounded-lg">
                        Soltar aquí
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {citasSinHora.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wide">Sin hora asignada</p>
            {citasSinHora.map(cita => renderCitaCard(cita))}
          </div>
        )}
      </>
    );
  };

  // ── Vista Mes ────────────────────────────────────────────────────────────────

  const renderVistaMes = () => {
    const diasMes = getMesGrid(fecha);
    return (
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card">
        {/* Cabecera días semana */}
        <div className="grid grid-cols-7 border-b border-surface-200 bg-surface-50">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-surface-500 border-r border-surface-100 last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        {/* Celdas */}
        <div className="grid grid-cols-7">
          {diasMes.map(({ fecha: dia, mesActual }) => {
            const citasDia = citasMes[dia] || [];
            const esHoy = dia === hoy;
            const isTarget = dropTarget?.fecha === dia;
            const d = new Date(dia + 'T12:00:00');
            const maxVisible = 3;
            const extra = citasDia.length - maxVisible;
            return (
              <div
                key={dia}
                className={`min-h-[110px] border-r border-b border-surface-200 last:border-r-0 p-1 transition-colors ${
                  !mesActual ? 'bg-surface-50/80' : 'bg-white'
                } ${isTarget ? 'bg-primary-50 ring-2 ring-inset ring-primary-300' : ''}`}
                onDragOver={(e) => handleDragOver(e, dia)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dia)}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <button
                    onClick={() => { setFecha(dia); setVista('dia'); }}
                    className={`w-7 h-7 text-sm font-semibold rounded-full flex items-center justify-center transition-colors ${
                      esHoy ? 'bg-primary-600 text-white' :
                      !mesActual ? 'text-surface-300' :
                      'text-surface-700 hover:bg-primary-100'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                  {mesActual && (
                    <button
                      onClick={() => abrirNuevo(dia)}
                      className="text-surface-300 hover:text-primary-600 hover:bg-primary-50 rounded p-0.5 transition-colors"
                      title="Nueva cita"
                    >
                      <FiPlus size={12} />
                    </button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {citasDia.slice(0, maxVisible).map(cita => {
                    const color = doctorColorMap[cita.doctor_id] || DOCTOR_COLORS[0];
                    const dragging = dragInfo?.cita?.id === cita.id;
                    return (
                      <div
                        key={cita.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cita)}
                        className={`rounded px-1 py-0.5 text-[11px] font-medium truncate cursor-grab active:cursor-grabbing flex items-center gap-1 ${color.light} ${color.text} ${dragging ? 'opacity-30' : 'hover:opacity-80'} transition-all`}
                        onClick={(e) => { e.stopPropagation(); abrirEditar(cita); }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.bg}`} />
                        <span className="truncate">{cita.hora_inicio?.slice(0, 5)} {cita.paciente?.apellido}</span>
                      </div>
                    );
                  })}
                  {extra > 0 && (
                    <button
                      onClick={() => { setFecha(dia); setVista('dia'); }}
                      className="text-[11px] text-primary-600 hover:underline pl-1"
                    >
                      +{extra} más
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Render principal ─────────────────────────────────────────────────────────

  const hoy = new Date().toISOString().split('T')[0];
  const diasSemana = getDiasSemana(fecha);

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary-800">Agenda de Citas</h1>
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-surface-100 rounded-2xl p-1">
            <button onClick={() => setVista('dia')} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${vista === 'dia' ? 'bg-white text-primary-700 shadow-md' : 'text-surface-500 hover:text-primary-600'}`}>
              <FiList size={14} /> Día
            </button>
            <button onClick={() => setVista('semana')} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${vista === 'semana' ? 'bg-white text-primary-700 shadow-md' : 'text-surface-500 hover:text-primary-600'}`}>
              <FiGrid size={14} /> Semana
            </button>
            <button onClick={() => setVista('mes')} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${vista === 'mes' ? 'bg-white text-primary-700 shadow-md' : 'text-surface-500 hover:text-primary-600'}`}>
              <FiCalendar size={14} /> Mes
            </button>
          </div>
          <button onClick={() => abrirNuevo()} className="btn-primary flex items-center gap-2">
            <FiPlus size={16} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => cambiarPeriodo(-1)} className="p-2.5 hover:bg-white/80 rounded-xl border border-surface-200 transition-all hover:shadow-sm">
          <FiChevronLeft size={20} className="text-surface-600" />
        </button>
        <div className="flex items-center gap-3">
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input-field w-auto" />
          <span className="text-surface-600 capitalize hidden sm:block font-medium">{getPeriodoLabel()}</span>
        </div>
        <button onClick={() => cambiarPeriodo(1)} className="p-2.5 hover:bg-white/80 rounded-xl border border-surface-200 transition-all hover:shadow-sm">
          <FiChevronRight size={20} className="text-surface-600" />
        </button>
        <button onClick={() => setFecha(hoy)} className="btn-secondary text-sm">Hoy</button>
        <button
          onClick={() => setShowFiltros(!showFiltros)}
          className={`btn-secondary text-sm flex items-center gap-1 ${(filtroDoctor || filtroEstado) ? 'ring-2 ring-primary-300' : ''}`}
        >
          <FiFilter size={14} /> Filtros
        </button>
      </div>

      {/* Filtros */}
      {showFiltros && (
        <div className="card flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Doctor</label>
            <select value={filtroDoctor} onChange={e => setFiltroDoctor(e.target.value)} className="input-field w-auto">
              <option value="">Todos</option>
              {doctores.map(d => <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Estado</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input-field w-auto">
              <option value="">Todos</option>
              {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <button onClick={() => { setFiltroDoctor(''); setFiltroEstado(''); }} className="btn-secondary text-sm">Limpiar</button>
          {doctores.length > 0 && (
            <div className="flex flex-wrap gap-2 border-l border-surface-200 pl-4 ml-2">
              <span className="text-xs text-surface-400 self-center">Referencias:</span>
              {doctores.map((d, i) => {
                const c = DOCTOR_COLORS[i % DOCTOR_COLORS.length];
                return (
                  <span key={d.id} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${c.light} ${c.text}`}>
                    <span className={`w-2 h-2 rounded-full ${c.bg}`} />
                    Dr. {d.apellido}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Vistas */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 animate-pulse">
          <FiCalendar size={36} className="mx-auto mb-3 opacity-40" />
          <p>Cargando agenda...</p>
        </div>
      ) : (
        <>
          {vista === 'dia' && (
            citas.length === 0 ? (
              <div className="card text-center text-gray-500 py-14">
                <FiCalendar size={40} className="mx-auto mb-3 text-surface-300" />
                <p className="font-medium">No hay citas para este día</p>
                <button onClick={() => abrirNuevo()} className="btn-primary mt-4">
                  <FiPlus size={14} className="inline mr-1" /> Nueva cita
                </button>
              </div>
            ) : renderVistaDia()
          )}
          {vista === 'semana' && renderVistaSemana()}
          {vista === 'mes'    && renderVistaMes()}
        </>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editando ? 'Editar Cita' : 'Nueva Cita'}>
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Paciente *</label>
            <select name="paciente_id" value={form.paciente_id} onChange={handleChange} className="input-field" required>
              <option value="">Seleccionar paciente</option>
              {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellido}, {p.nombre} — {p.dni}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Doctor *</label>
            <select name="doctor_id" value={form.doctor_id} onChange={handleChange} className="input-field" required>
              <option value="">Seleccionar doctor</option>
              {doctores.map(d => <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Fecha *</label>
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Hora inicio *</label>
              <input name="hora_inicio" type="time" value={form.hora_inicio} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Hora fin</label>
              <input name="hora_fin" type="time" value={form.hora_fin} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Motivo</label>
            <input name="motivo" value={form.motivo} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Estado</label>
            <select name="estado" value={form.estado} onChange={handleChange} className="input-field">
              {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} className="input-field" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{editando ? 'Actualizar' : 'Crear Cita'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

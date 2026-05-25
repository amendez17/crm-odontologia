import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FiFileText } from 'react-icons/fi';
import {FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight,FiList, FiGrid, FiFilter, FiMessageCircle, FiCalendar} from 'react-icons/fi';
import {fechaHoy, formatearFecha, formatearFechaHora, formatearHora, fechaLarga} from '../utils/fecha';
import socket from '../socket';

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

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const HORA_INICIO = 7;
const HORA_FIN = 22; // 10 PM



function getInicioSemana(fecha) {
  const d = new Date(fecha + 'T12:00:00');

  const dia = d.getDay(); // domingo = 0

  const inicio = new Date(d);

  inicio.setDate(d.getDate() - dia);

  return inicio;
}

function getDiasSemana(fecha) { const inicio = getInicioSemana(fecha);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
     return (
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') );
  });
}
function getMesGrid(fecha) {
  const d = new Date(fecha + 'T12:00:00');
  const año = d.getFullYear();
  const mes = d.getMonth();
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  let inicioGrid = primerDia.getDay();
  const dias = [];
  for (let i = inicioGrid; i > 0; i--) {
    dias.push({fecha: fechaHoy(new Date(año, mes, 1 - i)),mesActual: false});
  }
  for (let i = 1; i <= ultimoDia.getDate(); i++) {dias.push({fecha: fechaHoy(new Date(año, mes, i)),mesActual: true});
}  let ext = 1;
  while (dias.length % 7 !== 0) {
  dias.push({
    fecha: fechaHoy(new Date(año, mes + 1, ext++)),
    mesActual: false
  });
}
  return dias;
}

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatHora12(hora) {
  if (!hora) return '';

  let horas;
  let minutos;

  if (typeof hora === 'string' && hora.includes(':')) {
    [horas, minutos] = hora.split(':');
  } else {
    horas = hora;
    minutos = '00';
  }

  horas = parseInt(horas, 10);
  minutos = parseInt(minutos, 10);

  const sufijo = horas >= 12 ? 'PM' : 'AM';

  let hora12 = horas % 12;

  if (hora12 === 0) {
    hora12 = 12;
  }

  return `${hora12}:${String(minutos).padStart(2, '0')} ${sufijo}`;
}
function calcularOverlaps(citas) {

  const sorted = [...citas].sort(
    (a, b) =>
      timeToMinutes(a.hora_inicio) -
      timeToMinutes(b.hora_inicio)
  );

  const activas = [];

  sorted.forEach(cita => {

    const inicio =
      timeToMinutes(cita.hora_inicio);

    // eliminar citas que ya terminaron
    for (let i = activas.length - 1; i >= 0; i--) {

      const activaFin =
        timeToMinutes(activas[i].hora_fin);

      if (activaFin <= inicio) {
        activas.splice(i, 1);
      }
    }

    // detectar columnas ocupadas
    const usadas = activas.map(c => c.column);

    let columna = 0;

    while (usadas.includes(columna)) {
      columna++;
    }

    cita.column = columna;

    activas.push(cita);

    // total de columnas SOLO del grupo activo
    const total = Math.max(
      ...activas.map(c => c.column)
    ) + 1;

    activas.forEach(c => {
      c.totalColumns = total;
    });

  });

  return sorted;
}


export default function Citas() {
  const [citas, setCitas]           = useState([]);
  const [citasSemana, setCitasSemana] = useState({});
  const [citasMes, setCitasMes]     = useState({});
  const [doctores, setDoctores]     = useState([]);
  const [pacientes, setPacientes]   = useState([]);
  const [fecha, setFecha] = useState(fechaHoy());
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
  const [usuario, setUsuario] = useState(null);
  const [modalPaciente, setModalPaciente] = useState(false);
  const [formPaciente, setFormPaciente] = useState({ nombre: '', apellido: '', dni: '', telefono: ''});
  const abrirNuevoPaciente = () => { setFormPaciente({ nombre: '', apellido: '', dni: '', telefono: ''});setModalPaciente(true);};
  const [horaActual, setHoraActual] = useState(new Date());
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const minutosActuales =
  horaActual.getHours() * 60
  + horaActual.getMinutes();
  const HORAS = Array.from(
  { length: HORA_FIN - HORA_INICIO + 1 },
  (_, i) => HORA_INICIO + i
);
 const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

useEffect(() => {
  const onResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  window.addEventListener('resize', onResize);

  return () => window.removeEventListener('resize', onResize);
}, []);

const ALTURA_HORA = isMobile ? 42 : 90;

const PIXELS_POR_MINUTO = ALTURA_HORA / 60;

const TOTAL_MINUTOS =
  (HORA_FIN - HORA_INICIO + 1) * 60;
const calcularPosicionCita = (cita) => {
  const inicio = timeToMinutes(cita.hora_inicio);
  const fin = timeToMinutes(cita.hora_fin);

  return {
    top:
      (inicio - HORA_INICIO * 60) *
      PIXELS_POR_MINUTO,

    height:
      (fin - inicio) *
      PIXELS_POR_MINUTO
  };
};
  const topLinea =
  (minutosActuales - HORA_INICIO * 60) *
  PIXELS_POR_MINUTO;
 
//Guardar paciente
 const guardarPaciente = async (e) => {
  e.preventDefault();

  try {
    const { data } = await api.post('/pacientes', formPaciente);

    toast.success(`Paciente creado: ${data.dni}`);

    setPacientes(prev => [...prev, data]);

    setForm(prev => ({
      ...prev,
      paciente_id: data.id
    }));

    setModalPaciente(false);

  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al crear paciente');
  }
};
 const puedeUsarWhatsApp = useMemo(() => {
  return ['administrador', 'recepcionista'].includes(usuario?.rol);
}, [usuario]);
useEffect(() => {
socket.on('reconnect', () => {
  cargar();
});
  socket.on('cita-creada', (nuevaCita) => {

    // Vista día
    setCitas(prev => {
      const existe = prev.some(c => c.id === nuevaCita.id);

      if (existe) return prev;

      return [...prev, nuevaCita];
    });

    // Vista semana
    setCitasSemana(prev => {

      const copia = { ...prev };

      if (!copia[nuevaCita.fecha]) {
        copia[nuevaCita.fecha] = [];
      }

      const existe = copia[nuevaCita.fecha]
        .some(c => c.id === nuevaCita.id);

      if (!existe) {
        copia[nuevaCita.fecha] = [
          ...copia[nuevaCita.fecha],
          nuevaCita
        ];
      }

      return copia;
    });

    // Vista mes
    setCitasMes(prev => {

      const copia = { ...prev };

      if (!copia[nuevaCita.fecha]) {
        copia[nuevaCita.fecha] = [];
      }

      const existe = copia[nuevaCita.fecha]
        .some(c => c.id === nuevaCita.id);

      if (!existe) {
        copia[nuevaCita.fecha] = [
          ...copia[nuevaCita.fecha],
          nuevaCita
        ];
      }

      return copia;
    });

  });

  socket.on('cita-editada', (citaActualizada) => {

    // Día
    setCitas(prev =>
      prev.map(c =>
        c.id === citaActualizada.id
          ? citaActualizada
          : c
      )
    );

    // Semana
    setCitasSemana(prev => {

      const copia = { ...prev };

      Object.keys(copia).forEach(fecha => {
        copia[fecha] = copia[fecha].map(c =>
          c.id === citaActualizada.id
            ? citaActualizada
            : c
        );
      });

      return copia;
    });

    // Mes
    setCitasMes(prev => {

      const copia = { ...prev };

      Object.keys(copia).forEach(fecha => {
        copia[fecha] = copia[fecha].map(c =>
          c.id === citaActualizada.id
            ? citaActualizada
            : c
        );
      });

      return copia;
    });

  });

  socket.on('cita-eliminada', (id) => {

    setCitas(prev =>
      prev.filter(c => c.id !== id)
    );

    setCitasSemana(prev => {

      const copia = { ...prev };

      Object.keys(copia).forEach(fecha => {
        copia[fecha] =
          copia[fecha].filter(c => c.id !== id);
      });

      return copia;
    });

    setCitasMes(prev => {

      const copia = { ...prev };

      Object.keys(copia).forEach(fecha => {
        copia[fecha] =
          copia[fecha].filter(c => c.id !== id);
      });

      return copia;
    });

  });

  return () => {
    socket.off('cita-creada');
    socket.off('cita-editada');
    socket.off('cita-eliminada');
  };

}, []);
  
  useEffect(() => {
  const cargarUsuario = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUsuario(data);
    } catch (err) {
      console.error('Error cargando usuario', err);
      setUsuario(null);
    }
  };

  cargarUsuario();
}, []);
const pacientesFiltrados = useMemo(() => {
  if (!busquedaPaciente.trim()) return pacientes;

  const texto = busquedaPaciente.toLowerCase();

  return pacientes.filter((p) =>
    `${p.nombre} ${p.apellido} ${p.dni || ''}`
      .toLowerCase()
      .includes(texto)
  );
}, [pacientes, busquedaPaciente]);
  // Mapa doctor_id → color
  const doctorColorMap = useMemo(() => {
  const map = {};
  doctores.forEach((d, i) => {
    map[d.id] = DOCTOR_COLORS[i % DOCTOR_COLORS.length];
  });
  return map;
}, [doctores]);

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
      const desde = fechaHoy(new Date(d.getFullYear(), d.getMonth(), 1));
      const hasta = fechaHoy(new Date(d.getFullYear(), d.getMonth() + 1, 0));
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
  useEffect(() => { const interval = setInterval(() => { setHoraActual(new Date()); }, 60000);
  
  return () => clearInterval(interval);

}, []);

  // ── Navegación ──────────────────────────────────────────────────────────────

  const cambiarPeriodo = (dir) => {
  const d = new Date(fecha + 'T12:00:00');

  if (vista === 'dia') {
    d.setDate(d.getDate() + dir);
  } else if (vista === 'semana') {
    d.setDate(d.getDate() + dir * 7);
  } else {
    d.setMonth(d.getMonth() + dir);
  }

  setFecha(fechaHoy(d));
};

  const formatFecha = (f) => { return fechaLarga(f);};
  const formatFechaCorta = (f) => { return new Date(f).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan', day: 'numeric', month: 'short'});};
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
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta cita?')) return;
    try { await api.delete(`/citas/${id}`); toast.success('Cita eliminada'); cargar(); }
    catch { toast.error('Error al eliminar'); }
  };

  const cambiarEstado = async (id, estado) => {
    try { await api.put(`/citas/${id}`, { estado }); cargar(); }
    catch { toast.error('Error al cambiar estado'); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const crearPresupuestoDesdeCita = async (cita) => {
  try {
    const payload = {
      paciente_id: cita.paciente_id,
      doctor_id: cita.doctor_id,
      cita_id: cita.id,
      fecha: cita.fecha,
      descripcion: cita.motivo || '',
    };

    await api.post('/presupuestos', payload);
    toast.success('Presupuesto creado desde la cita');
  } catch (err) {
    toast.error('Error al crear presupuesto');
  }
};

  const enviarWhatsApprecordatorio = (cita) => {
  const tel = cita.paciente?.telefono?.replace(/\D/g, '') || '';
  if (!tel) {
    toast.error('El paciente no tiene teléfono registrado');
    return;
  }
const fechaFmt = fechaLarga(cita.fecha);
    

  const msg = encodeURIComponent(
  `Hola ${cita.paciente?.nombre || ''} ${cita.paciente?.apellido || ''}\n` +
  `Le recordamos su cita programada para mañana.\n\n` +
  `📅 ${fechaFmt}\n` +
  `🕐 ${formatHora12(cita.hora_inicio)} hs\n` +
  `${cita.motivo ? `📋 Motivo: ${cita.motivo}\n` : ''}` +
  `📍 Ubicación: https://share.google/wqMNC1dw6leUb5SLa\n\n` +
  `Si necesita reprogramar, por favor avísenos con anticipación.\n\n` +
  `Por favor confirme su asistencia. ¡Gracias!`
);
  window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
};

  const enviarWhatsApp = (cita) => {
  const tel = cita.paciente?.telefono?.replace(/\D/g, '') || '';
  if (!tel) {
    toast.error('El paciente no tiene teléfono registrado');
    return;
  }
const fechaFmt = fechaLarga(cita.fecha);
      

  const msg = encodeURIComponent(
    `Hola ${cita.paciente?.nombre || ''} ${cita.paciente?.apellido || ''}\n` +
    `Su cita ha quedado confirmada con éxito.\n\n` +
    `📅 ${fechaFmt}\n` +
    `🕐 ${formatHora12(cita.hora_inicio)} hs\n` +
    `${cita.motivo ? `📋 Motivo: ${cita.motivo}\n` : ''}` +
    `📍 Ubicación: https://share.google/wqMNC1dw6leUb5SLa\n\n` +
    `Le recordamos llegar 10 minutos antes.\n`+
    `Será un gusto atenderle.\n`+
    `Cualquier duda estamos a sus órdenes.\n`+
    `Por favor confirme su asistencia. ¡Gracias!`
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
   
    } catch { toast.error('Error al reprogramar la cita'); }
  };
 const hoy = fechaHoy();
  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderCitaChip = (cita, style = {}) => {

  const color =
    doctorColorMap[cita.doctor_id]
    || DOCTOR_COLORS[0];

  return (
    <div
  key={cita.id}
  draggable
  onClick={() => setCitaSeleccionada(cita)}
      onDragStart={(e) => handleDragStart(e, cita)}
      style={style}
      className={`
  rounded-lg
  border-l-4
  ${color.border}
  ${color.light}
  p-[1px] md:p-1
  overflow-y-auto
  cursor-pointer
  shadow-sm
  hover:shadow-md
  transition-all
  flex
  flex-col
  gap-1
  h-full
`}    >

      {/* HEADER */}

      <div className="flex items-start justify-between gap-1">

        <div className="min-w-0">

          <p className={`font-bold text-[8px] md:text-[9px] md:text-[9px] md:text-xs ${color.text}`}>
            {formatHora12(cita.hora_inicio)}
          </p>

          <p className="text-[8px] md:text-[8px] md:text-[9px] md:text-xs font-semibold text-gray-800 truncate">
            {cita.paciente?.nombre}
          </p>

        </div>

        
      </div>

      {/* MOTIVO */}

      {cita.motivo && (
        <div className="
          text-[11px]
          text-gray-700
          leading-tight
          line-clamp-1 md:line-clamp-2
        ">
          {cita.motivo}
        </div>
      )}

      {/* NOTAS */}

      {cita.notas && (
        <div className="
          text-[10px]
          text-gray-500
          leading-tight
          line-clamp-1 md:line-clamp-2
        ">
          {cita.notas}
        </div>
      )}

    </div>
  );
};
  const renderCitaCard = (cita) => {
    const color = doctorColorMap[cita.doctor_id] || DOCTOR_COLORS[0];
    return (
      <div key={cita.id} className={`card flex flex-col lg:flex-row items-start lg:items-center gap-4 items-start sm:items-center justify-between gap-4 border-l-4 ${color.border}`}>
        <div className="flex items-center gap-4">
          <div className={`text-center min-w-[60px] ${color.light} rounded-xl px-3 py-2`}>
            <p className={`text-lg font-bold ${color.text}`}>{formatHora12(cita.hora_inicio)}</p>
            {cita.hora_fin && <p className="text-[9px] md:text-[9px] md:text-[9px] md:text-xs text-surface-400">{formatHora12(cita.hora_fin)}</p>}
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
            className={`badge ${ESTADOS[cita.estado]?.cls} border-0 cursor-pointer text-[9px] md:text-[9px] md:text-xs pr-6`}
          >
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => enviarWhatsApp(cita)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="WhatsApp"><FiMessageCircle size={15} /></button>
          <button onClick={() => crearPresupuestoDesdeCita(cita)}  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"  title="Crear presupuesto">  <FiFileText size={15} /></button>
          <button onClick={() => abrirEditar(cita)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"><FiEdit2 size={15} /></button>
          <button onClick={() => eliminar(cita.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 size={15} /></button>
        </div>
      </div>
    );
  };

  // ── Vista Semana (grilla horaria + DnD) ─────────────────────────────────────


const renderVistaSemana = () => {

  return (
    <div   className="     overflow-x-auto     overflow-y-auto     w-full     bg-white     rounded-2xl     border     relative   "   style={{     maxHeight: '80vh'   }} >

      <div
  className="
    grid
    w-full
  "
  style={{
    gridTemplateColumns:
  isMobile
    ? '32px repeat(7, 1fr)'
    : '60px repeat(7, 1fr)'
  }}
>

        {/* CABECERA */}

        <div className="sticky top-0 bg-white z-10 border-b" />

        {diasSemana.map((dia, i) => {

          const d = new Date(dia + 'T12:00:00');

          return (
            <div
              key={dia}
              className="   border-l   p-1   md:p-2   text-center   bg-white/95   backdrop-blur   sticky   top-0   z-10   border-b "
            >
              <div className="text-[9px] md:text-[9px] md:text-xs text-gray-500">
                {DIAS_SEMANA[i]}
              </div>

              <div className="font-bold text-xs md:text-base">
                {d.getDate()}
              </div>
            </div>
          );
        })}

        {/* HORAS */}

        <div className="relative">

          {Array.from({length: HORA_FIN - HORA_INICIO + 1}).map((_, i) => {
          const hora = HORA_INICIO + i;

            return (
             <div key={hora} className="border-t text-[10px] text-gray-400 pr-1 text-right" style={{height: `${ALTURA_HORA}px`}}>
  {formatHora12(`${String(hora).padStart(2,'0')}:00`)}
</div>            );
          })}
        </div>

        {/* COLUMNAS DIAS */}

        {diasSemana.map((dia) => {

         const citasDia = calcularOverlaps( [...(citasSemana[dia] || [])]);

          return (
            <div key={dia} className="relative border-l" style={{height: TOTAL_MINUTOS * PIXELS_POR_MINUTO}}>

              {/* LINEAS */}

              {Array.from({
                length: TOTAL_MINUTOS / 30
              }).map((_, i) => (

                <div
                  key={i}
                  className="
                    absolute
                    left-0
                    right-0
                    border-t
                    border-gray-100
                  "
                  style={{
                    top:
                      i * 30
                      * PIXELS_POR_MINUTO
                  }}
                />
              ))}
              {/* LINEA HORA ACTUAL */}

{dia === fechaHoy() && (
  <div
    className="
      absolute
      left-0
      right-0
      h-[2px]
      bg-red-500
      z-[2]
    "
    style={{
      top: topLinea
    }}
  />
)}

              {/* CITAS */}

              {citasDia.map((cita) => {

                const { top, height } =
                  calcularPosicionCita(cita);

                return (
                  <div key={cita.id} style={{ position: 'absolute', top, height, width: `calc(${100 / cita.totalColumns}% - 4px)`, left: `calc(${(100 / cita.totalColumns) * cita.column}% + 2px)`, }}>
                    {renderCitaChip(cita)} </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
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
                    <span className="text-[9px] md:text-[9px] md:text-xs text-surface-400">{formatHora12(horaStr)}</span>
                  </div>
                  <div className="flex-1 p-1 space-y-1">
                    {citasHora.map(cita => renderCitaCard(cita))}
                    {isTarget && !citasHora.length && (
                      <div className="text-[9px] md:text-[9px] md:text-xs text-primary-500 text-center py-2 border-2 border-dashed border-primary-300 rounded-lg">
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
            <p className="text-[9px] md:text-[9px] md:text-xs font-medium text-surface-400 uppercase tracking-wide">Sin hora asignada</p>
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
            <div key={d} className="py-2 text-center text-[9px] md:text-[9px] md:text-xs font-semibold text-surface-500 border-r border-surface-100 last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        {/* Celdas */}
        <div className=" grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 ">
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
                        <span className="truncate">{formatHora12(cita.hora_inicio)} {cita.paciente?.apellido}</span>
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

 
  const diasSemana = getDiasSemana(fecha);
 //___validacion usuario____________
    if (!usuario) {
  return (
    <div className="text-center py-10 text-gray-400">
      Cargando usuario...
    </div>
  );
}
  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className=" flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ">
        <h1 className="text-2xl font-bold text-primary-800">Agenda de Citas</h1>
        <div className=" flex flex-col sm:flex-row w-full lg:w-auto gap-2 ">
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
          <button onClick={() => abrirNuevo()} className=" btn-primary flex items-center justify-center gap-2 w-full sm:w-auto ">
            <FiPlus size={16} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Navegación */}
      <div className=" flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ">
        <button onClick={() => cambiarPeriodo(-1)} className="p-2.5 hover:bg-white/80 rounded-xl border border-surface-200 transition-all hover:shadow-sm">
          <FiChevronLeft size={20} className="text-surface-600" />
        </button>
        <div className="flex items-center gap-3">
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input-field w-full sm:w-auto" />
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
        <div className=" card grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Doctor</label>
            <select value={filtroDoctor} onChange={e => setFiltroDoctor(e.target.value)} className="input-field w-full sm:w-auto">
              <option value="">Todos</option>
              {doctores.map(d => <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Estado</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input-field w-full sm:w-auto">
              <option value="">Todos</option>
              {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <button onClick={() => { setFiltroDoctor(''); setFiltroEstado(''); }} className="btn-secondary text-sm">Limpiar</button>
          {doctores.length > 0 && (
            <div className="flex flex-wrap gap-2 border-l border-surface-200 pl-4 ml-2">
              <span className="text-[9px] md:text-[9px] md:text-xs text-surface-400 self-center">Referencias:</span>
              {doctores.map((d, i) => {
                const c = DOCTOR_COLORS[i % DOCTOR_COLORS.length];
                return (
                  <span key={d.id} className={`flex items-center gap-1 text-[9px] md:text-[9px] md:text-xs px-2 py-1 rounded-full ${c.light} ${c.text}`}>
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
            <label className="block text-sm font-medium text-surface-600 mb-1"> Paciente *</label>

       <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
        <div className="flex-1 relative overflow-visible">
         <input
  type="text"
  placeholder="Buscar paciente..."
  value={
    form.paciente_id
      ? pacientes.find(p => p.id == form.paciente_id)
        ? `${pacientes.find(p => p.id == form.paciente_id).nombre} ${pacientes.find(p => p.id == form.paciente_id).apellido}`
        : busquedaPaciente
      : busquedaPaciente
  }
  onChange={(e) => {
    setBusquedaPaciente(e.target.value);
    setForm({ ...form, paciente_id: '' });
  }}
  className="input-field w-full text-base sm:text-sm"
  autoComplete="off"
  required
/>

    {busquedaPaciente && !form.paciente_id && (
      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 sm:max-h-72 overflow-y-auto text-sm">
        {pacientesFiltrados.length > 0 ? (
          pacientesFiltrados.map((p) => (
            <button type="button" key={p.id}
             onClick={() => { setForm({ ...form, paciente_id: p.id });
             setBusquedaPaciente( `${p.nombre} ${p.apellido}`);

          // cerrar autocomplete
              setTimeout(() => { setBusquedaPaciente( `${p.nombre} ${p.apellido}` ); }, 0); }}

              
              className="w-full text-left px-4 py-4 hover:bg-primary-50 border-b last:border-b-0">
              <p className="font-medium">
                {p.nombre} {p.apellido}
              </p>

              <p className="text-sm text-gray-500">
                {p.dni}
              </p>
            </button>
          ))
        ) : (
          <div className="px-4 py-3 text-sm text-gray-500">
            No se encontraron pacientes
          </div>
        )}
      </div>
    )}
  </div>

  {/* BOTÓN NUEVO PACIENTE */}
  <button type="button" onClick={abrirNuevoPaciente} className=" btn-secondary h-[42px] w-full sm:w-auto sm:px-3 flex items-center justify-center gap-2 shrink-0 " title="Nuevo paciente">
  <FiPlus />
  <span className="sm:hidden">Nuevo paciente</span>
</button>
       </div>
</div>
           <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Doctor *</label>
            <select name="doctor_id" value={form.doctor_id} onChange={handleChange} className="input-field" required>
              <option value="">Seleccionar doctor</option>
              {doctores.map(d => <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido}</option>)}
            </select>
          </div>
          <div className=" grid grid-cols-1 md:grid-cols-3 gap-3 ">
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
          <div className=" flex flex-col-reverse sm:flex-row justify-end gap-3 pt-1 ">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary w-full sm:w-auto">Cancelar</button>
            <button type="submit" className="btn-primary w-full sm:w-auto">{editando ? 'Actualizar' : 'Crear Cita'}</button>
          </div>
        </form>
      </Modal>
      <Modal
  isOpen={modalPaciente}
  onClose={() => setModalPaciente(false)}
  title="Nuevo Paciente"
>
  <form onSubmit={guardarPaciente} className="space-y-4">
    <label>Nombre</label>
    <input
      name="nombre"
      value={formPaciente.nombre}
      onChange={(e) => setFormPaciente({ ...formPaciente, nombre: e.target.value })}
      className="input-field"
      placeholder="Ingrese Nombre"
      required
    />
    <label>Apellido</label>
    <input
      name="apellido"
      value={formPaciente.apellido}
      onChange={(e) => setFormPaciente({ ...formPaciente, apellido: e.target.value })}
      className="input-field"
      placeholder="Ingrese Apellido"
      required
    />
    <label>Número de paciente</label>
    <input  name="dni" value={formPaciente.dni || ''} className="input-field" placeholder="Número de Paciente Automático" readOnly/>
    <label>Telefono</label>
    <input
      name="Teléfono"
      value={formPaciente.telefono}
      onChange={(e) => setFormPaciente({ ...formPaciente, telefono: e.target.value })}
      className="input-field"
      placeholder="Ingrese Número de Teléfono"
    />

    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => setModalPaciente(false)}
        className="btn-secondary w-full sm:w-auto"
      >
        Cancelar
      </button>
      <button type="submit" className="btn-primary w-full sm:w-auto">
        Crear
      </button>
    </div>
  </form>
</Modal>
      <Modal
  isOpen={!!citaSeleccionada}
  onClose={() => setCitaSeleccionada(null)}
  title="Detalle de cita"
>
  {citaSeleccionada && (
    <div className="space-y-4">

      {/* PACIENTE */}

      <div>
        <p className="text-sm text-gray-500">
          Paciente
        </p>

        <p className="font-semibold text-lg">
          {citaSeleccionada.paciente?.nombre}
          {' '}
          {citaSeleccionada.paciente?.apellido}
        </p>
      </div>

      {/* DOCTOR */}

      <div>
        <p className="text-sm text-gray-500">
          Doctor
        </p>

        <p>
          Dr.
          {' '}
          {citaSeleccionada.doctor?.nombre}
          {' '}
          {citaSeleccionada.doctor?.apellido}
        </p>
      </div>

      {/* HORARIO */}

      <div>
        <p className="text-sm text-gray-500">
          Horario
        </p>

        <p>
          {formatHora12(citaSeleccionada.hora_inicio)}
          {' - '}
          {formatHora12(citaSeleccionada.hora_fin)}
        </p>
      </div>

      {/* MOTIVO */}

      {citaSeleccionada.motivo && (
        <div>
          <p className="text-sm text-gray-500">
            Motivo
          </p>

          <p>
            {citaSeleccionada.motivo}
          </p>
        </div>
      )}

      {/* NOTAS */}

      {citaSeleccionada.notas && (
        <div>
          <p className="text-sm text-gray-500">
            Notas
          </p>

          <p className="whitespace-pre-line">
            {citaSeleccionada.notas}
          </p>
        </div>
      )}

      {/* ESTADO */}

      <div>
        <p className="text-sm text-gray-500 mb-1">
          Estado
        </p>

        <select
          value={citaSeleccionada.estado}
          onChange={(e) => {
            cambiarEstado(
              citaSeleccionada.id,
              e.target.value
            );

            setCitaSeleccionada({
              ...citaSeleccionada,
              estado: e.target.value
            });
          }}
          className={`
            input-field
            ${ESTADOS[citaSeleccionada.estado]?.cls || ''}
          `}
        >
          {Object.entries(ESTADOS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* BOTONES */}

      <div className="flex gap-2 flex-wrap pt-2">

        {puedeUsarWhatsApp && (
          <button
            onClick={() =>
              enviarWhatsApp(citaSeleccionada)
            }
            className="btn-secondary w-full sm:w-auto"
          >
            <FiMessageCircle  />
           Confirmacion cita
          </button>
        )}
 {puedeUsarWhatsApp && (
          <button
            onClick={() =>
             enviarWhatsApprecordatorio(citaSeleccionada)
            }
            className="btn-secondary w-full sm:w-auto"
          >
            <FiMessageCircle className="text-[#f5a60a]" />
            Recordatorio cita
          </button>
        )}
        <button
          onClick={() =>
            crearPresupuestoDesdeCita(
              citaSeleccionada
            )
          }
          className="btn-secondary w-full sm:w-auto"
        >
          <FiFileText className="inline mr-1" />
          Presupuesto
        </button>

        <button
          onClick={() => {
            setCitaSeleccionada(null);
            abrirEditar(citaSeleccionada);
          }}
          className="btn-secondary w-full sm:w-auto"
        >
          <FiEdit2 className="inline mr-1" />
          Editar
        </button>

        <button
          onClick={() => {
            eliminar(citaSeleccionada.id);
            setCitaSeleccionada(null);
          }}
          className="btn-danger w-full sm:w-auto"
        >
          <FiTrash2 className="inline mr-1" />
          Eliminar
        </button>

      </div>
    </div>
  )}
</Modal>

      <button onClick={() => abrirNuevo()} className=" fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-xl flex items-center justify-center transition-all hover:scale-105  " title="Nueva cita">
  <FiPlus size={26} /></button>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import socket from '../socket';
import Modal from './Modal';
import toast from 'react-hot-toast';
import {
  FiHome, FiUsers, FiCalendar, FiClipboard, FiFileText, FiDollarSign,
  FiSettings, FiLogOut, FiMenu, FiX, FiBarChart2, FiBell, FiLock,
  FiSliders, FiSearch, FiActivity, FiChevronsLeft, FiChevronsRight, FiShield,
  FiCheckCircle, FiPhone
} from 'react-icons/fi';

const navItems = [
  { to: '/dashboard', icon: FiHome, label: 'Dashboard', end: true, roles: ["administrador", "doctor", "recepcionista"] },
  { to: '/pacientes', icon: FiUsers, label: 'Pacientes', roles: ["administrador", "doctor", "recepcionista"] },
  { to: '/citas', icon: FiCalendar, label: 'Citas', roles: ["administrador", "doctor", "recepcionista"] },
  { to: '/tratamientos', icon: FiClipboard, label: 'Tratamientos', roles: ["administrador", "doctor"] },
  { to: '/presupuestos', icon: FiFileText, label: 'Presupuestos', roles: ["administrador", "doctor"] },
  { to: '/pagos', icon: FiDollarSign, label: 'Pagos', roles: ["administrador", "doctor", "recepcionista"] },
  { to: '/reportes', icon: FiBarChart2, label: 'Reportes', roles: ["administrador"] },
  { to: '/usuarios', icon: FiSettings, label: 'Usuarios', roles: ["administrador"] },
  { to: '/actividad', icon: FiActivity, label: 'Actividad', roles: ["administrador"] },
  { to: '/mantenimiento', icon: FiShield, label: 'Mantenimiento', roles: ["administrador"] },
  { to: '/configuracion', icon: FiSliders, label: 'Configuración', roles: ["administrador"] },
];
export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [collapsed, setCollapsed]           = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotif, setShowNotif]           = useState(false);
  const [modalPassword, setModalPassword]   = useState(false);
  const [passwordForm, setPasswordForm]     = useState({ actual: '', nueva: '', confirmar: '' });
  const [busqueda, setBusqueda]             = useState('');
  const [resultados, setResultados]         = useState([]);
  const [showBusqueda, setShowBusqueda]     = useState(false);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const cargarNotificaciones = async () => {
    try {
      const hoy = new Date();
      const manana = new Date(hoy);
      manana.setDate(hoy.getDate() + 1);
      const hoyStr = hoy.toISOString().split('T')[0];
      const mananaStr = manana.toISOString().split('T')[0];
      const [citasRespuesta, alertasRespuesta] = await Promise.all([
        api.get('/citas', { params: { desde: hoyStr, hasta: mananaStr } }),
        api.get('/notificaciones')
      ]);
      const citas = citasRespuesta.data
        .filter(c => c.estado === 'programada' || c.estado === 'confirmada')
        .map(cita => ({ ...cita, tipo_notificacion: 'cita', clave: `cita-${cita.id}` }));
      const facturas = (alertasRespuesta.data.facturas || []).map(pago => ({ ...pago, tipo_notificacion: 'factura', clave: `factura-${pago.id}` }));
      const limpiezas = (alertasRespuesta.data.limpiezas || []).map(paciente => ({ ...paciente, tipo_notificacion: 'limpieza', clave: `limpieza-${paciente.id}` }));
      setNotificaciones([...facturas, ...limpiezas, ...citas]);
    } catch {}
  };

  useEffect(() => {
    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const actualizarPorCita = cita => {
      if (cita?.estado === 'completada') {
        setNotificaciones(actuales => actuales.filter(item =>
          item.clave !== `cita-${cita.id}` && item.clave !== `limpieza-${cita.paciente_id}`
        ));
      }
      cargarNotificaciones();
    };
    const actualizarSinDatos = () => cargarNotificaciones();
    socket.on('cita-creada', actualizarPorCita);
    socket.on('cita-editada', actualizarPorCita);
    socket.on('cita-eliminada', actualizarSinDatos);
    socket.on('reconnect', actualizarSinDatos);
    return () => {
      socket.off('cita-creada', actualizarPorCita);
      socket.off('cita-editada', actualizarPorCita);
      socket.off('cita-eliminada', actualizarSinDatos);
      socket.off('reconnect', actualizarSinDatos);
    };
  }, []);

  const marcarFacturaEmitida = async pagoId => {
    try {
      await api.put(`/notificaciones/facturas/${pagoId}/emitida`);
      setNotificaciones(actuales => actuales.filter(item => !(item.tipo_notificacion === 'factura' && item.id === pagoId)));
      toast.success('Factura marcada como emitida');
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo actualizar la factura');
    }
  };

  const enlaceWhatsAppLimpieza = paciente => {
    const digitos = String(paciente.telefono || '').replace(/\D/g, '');
    const numero = digitos.length === 10 ? `52${digitos}` : digitos;
    const mensaje = `Hola ${paciente.nombre}, te recordamos que han pasado 4 meses desde tu última visita a Clínica Dental Almar. Es buen momento para agendar tu limpieza dental preventiva. ¿Te gustaría programar una cita?`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  };

  useEffect(() => {
    if (busqueda.length < 2) { setResultados([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/pacientes', { params: { buscar: busqueda, limit: 8 } });
        setResultados(data.pacientes || []);
        setShowBusqueda(true);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const irAPaciente = (id) => {
    navigate(`/pacientes/${id}`);
    setBusqueda('');
    setShowBusqueda(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    if (passwordForm.nueva !== passwordForm.confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordForm.nueva.length < 12 || !/[a-z]/.test(passwordForm.nueva) || !/[A-Z]/.test(passwordForm.nueva) || !/\d/.test(passwordForm.nueva) || !/[^A-Za-z0-9]/.test(passwordForm.nueva)) {
      toast.error('Usa al menos 12 caracteres con mayúscula, minúscula, número y símbolo');
      return;
    }
    try {
      await api.post('/auth/cambiar-password', {
        passwordActual: passwordForm.actual,
        passwordNueva: passwordForm.nueva
      });
      toast.success('Contraseña actualizada');
      setModalPassword(false);
      setPasswordForm({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  const sidebarW = collapsed ? 'w-[min(86vw,300px)] lg:w-[72px]' : 'w-[min(86vw,300px)] lg:w-[260px] xl:w-[280px]';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 ${sidebarW} bg-gradient-sidebar shadow-sidebar transform transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col overflow-hidden`}>

      {/* Logo */}
<div
  className={`flex items-center border-b border-white/5 h-[70px] flex-shrink-0 ${
    collapsed ? 'px-4 gap-3 lg:justify-center lg:px-0 lg:gap-0' : 'px-4 gap-3'
  }`}
>
  {/* Logo glass */}
<div className="w-11 h-11 rounded-2xl bg-white/40 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgba(255,255,255,0.18)] flex items-center justify-center flex-shrink-0 relative overflow-hidden">    
   {/* brillo superior */}
  <div
    className="
      absolute inset-0
      bg-gradient-to-br
      from-white/80
      via-white/25
      to-transparent
      pointer-events-none
    "
  />
   {/* reflejo */}
  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 blur-md rounded-full pointer-events-none"/>
  
    <img
    src="/logo_clinica-removebg-preview.png"
    alt="Clinica Dental Almar"
    className="w-14 h-14 object-contain relative z-10"
  />
</div>
  {/* Texto */}
    <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
      <p className="text-white font-bold text-base leading-tight truncate">
        Clinica Dental Almar
      </p>

      <p className="text-white/60 text-[11px] truncate">
        Sistema dental
      </p>
    </div>

  {/* Mobile close */}
  <button
    className="lg:hidden ml-auto text-white/70 hover:text-white"
    onClick={() => setSidebarOpen(false)}
  >
    <FiX size={18} />
  </button>
</div>
        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.filter(item => item.roles.includes(usuario?.rol)) .map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
              }
            >
              <Icon size={19} className="flex-shrink-0" />
              <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: cambiar clave + logout + collapse toggle */}
        <div className="px-2 py-3 border-t border-white/10 space-y-0.5 flex-shrink-0">
          <button
            onClick={() => setModalPassword(true)}
            title={collapsed ? 'Cambiar contraseña' : undefined}
            className={`nav-item nav-item-inactive ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <FiLock size={18} className="flex-shrink-0" />
            <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>Cambiar clave</span>
          </button>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={`nav-item text-red-300 hover:bg-red-500/20 hover:text-red-200 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <FiLogOut size={18} className="flex-shrink-0" />
            <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>Cerrar sesión</span>
          </button>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleCollapse}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className={`hidden lg:flex nav-item text-white/40 hover:bg-white/10 hover:text-white mt-1 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            {collapsed
              ? <FiChevronsRight size={18} className="flex-shrink-0" />
              : <><FiChevronsLeft size={18} className="flex-shrink-0" /><span className="truncate text-xs">Colapsar</span></>
            }
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className=" h-[65px] sm:h-[70px] bg-white/80 backdrop-blur-md border-b border-surface-200/50 flex items-center px-3 sm:px-5 lg:px-8 gap-2 sm:gap-4 relative z-50 shrink-0 ">
          <button className="lg:hidden p-2 text-primary-700 hover:bg-primary-50 rounded-xl" onClick={() => setSidebarOpen(true)}>
            <FiMenu size={22} />
          </button>

          {/* Welcome & Search */}
          <div className="hidden md:block">
            <h2 className="text-lg font-bold text-primary-800">
              {usuario?.nombre} {usuario?.apellido}
            </h2>
            <p className="text-xs text-surface-400 -mt-0.5 capitalize">{usuario?.rol}</p>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className=" relative flex-1 max-w-full sm:max-w-sm md:max-w-md ">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onFocus={() => resultados.length > 0 && setShowBusqueda(true)}
              placeholder="Buscar paciente..."
              className=" w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm bg-surface-50 border border-surface-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white outline-none transition-all"
            />
            {showBusqueda && resultados.length > 0 && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBusqueda(false)} />
                <div className="absolute left-0 right-0 top-12 z-50 bg-white rounded-2xl shadow-xl border border-surface-200 overflow-hidden animate-slide-up">
                  {resultados.map(pac => (
                    <button
                      key={pac.id}
                      onClick={() => irAPaciente(pac.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d6c08d] to-[#bfa46f] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {pac.nombre[0]}{pac.apellido[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{pac.nombre}, {pac.apellido}</p>
                        <p className="text-xs text-surface-400">DNI: {pac.dni}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex-1 hidden lg:block" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                const abrir = !showNotif;
                setShowNotif(abrir);
                if (abrir) cargarNotificaciones();
              }}
              className="relative p-2.5 text-surface-500 hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-all"
            >
              <FiBell size={20} />
              {notificaciones.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-accent-500 to-accent-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                  {notificaciones.length}
                </span>
              )}
            </button>

            {showNotif && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                <div className="fixed left-3 right-3 top-[72px] z-[9999] sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-80 bg-white rounded-2xl shadow-xl border border-surface-200 overflow-hidden animate-slide-up">
                  <div className="px-4 py-3 bg-gradient-to-r from-[#cbb27c] to-[#b89a5f] text-white">
                    <h3 className="font-semibold text-sm">Notificaciones</h3>
                    <p className="text-xs text-white/80">Citas, facturas y seguimiento preventivo</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificaciones.length === 0 ? (
                      <p className="text-sm text-surface-400 text-center py-6">No hay notificaciones pendientes</p>
                    ) : (
                      notificaciones.map(notificacion => {
                        if (notificacion.tipo_notificacion === 'factura') return <div key={notificacion.clave} className="border-b border-surface-100 bg-amber-50/50 px-4 py-3">
                          <div className="flex items-start justify-between gap-2"><div><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">FACTURA PENDIENTE</span><p className="mt-1 text-sm font-semibold text-gray-900">{notificacion.paciente?.nombre} {notificacion.paciente?.apellido}</p><p className="text-xs text-surface-500">Pago de ${Number(notificacion.monto).toLocaleString()} · {new Date(`${notificacion.fecha}T12:00:00`).toLocaleDateString('es-MX')}</p></div><FiFileText className="mt-1 text-amber-600" /></div>
                          <div className="mt-2 flex gap-2"><Link to={`/pacientes/${notificacion.paciente_id}`} onClick={() => setShowNotif(false)} className="text-xs font-semibold text-primary-700">Ver paciente</Link><button type="button" onClick={() => marcarFacturaEmitida(notificacion.id)} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-green-700"><FiCheckCircle /> Marcar emitida</button></div>
                        </div>;
                        if (notificacion.tipo_notificacion === 'limpieza') return <div key={notificacion.clave} className="border-b border-surface-100 bg-blue-50/50 px-4 py-3">
                          <div className="flex items-start justify-between gap-2"><div><span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">LIMPIEZA · 4 MESES</span><p className="mt-1 text-sm font-semibold text-gray-900">{notificacion.nombre} {notificacion.apellido}</p><p className="text-xs text-surface-500">Última visita: {new Date(`${notificacion.ultima_visita}T12:00:00`).toLocaleDateString('es-MX')}</p></div><FiPhone className="mt-1 text-blue-600" /></div>
                          <div className="mt-2 flex gap-3"><Link to={`/pacientes/${notificacion.id}`} onClick={() => setShowNotif(false)} className="text-xs font-semibold text-primary-700">Ver paciente</Link>{notificacion.telefono && <a href={enlaceWhatsAppLimpieza(notificacion)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-green-700">Enviar WhatsApp</a>}</div>
                        </div>;
                        const hoyStr = new Date().toISOString().split('T')[0];
                        const esHoy = notificacion.fecha === hoyStr;
                        return (
                          <div key={notificacion.clave} className="px-4 py-3 border-b border-surface-100 hover:bg-surface-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900">
                                {notificacion.paciente?.nombre} {notificacion.paciente?.apellido}
                              </p>
                              <div className="text-right flex items-center gap-2">
                                <span className="text-sm font-bold text-primary-600">{notificacion.hora_inicio?.slice(0, 5)}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${esHoy ? 'bg-dental-100 text-dental-700' : 'bg-primary-100 text-primary-700'}`}>
                                  {esHoy ? 'HOY' : 'MAÑANA'}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-surface-400 mt-0.5">
                              Dr. {notificacion.doctor?.nombre} {notificacion.doctor?.apellido}
                              {notificacion.motivo && ` - ${notificacion.motivo}`}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <Link
                    to="/citas"
                    onClick={() => setShowNotif(false)}
                    className="block text-center text-sm text-primary-600 hover:bg-primary-50 py-3 font-semibold"
                  >
                    Ver agenda completa
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* User avatar */}
          <div className=" w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#d6c08d] to-[#b89a5f] flex items-center justify-center text-white font-bold text-sm shadow-md">
            {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Modal Cambiar Contraseña */}
      <Modal isOpen={modalPassword} onClose={() => setModalPassword(false)} title="Cambiar Contraseña" size="sm">
        <form onSubmit={cambiarPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual *</label>
            <input
              type="password"
              value={passwordForm.actual}
              onChange={e => setPasswordForm({ ...passwordForm, actual: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña *</label>
            <input
              type="password"
              value={passwordForm.nueva}
              onChange={e => setPasswordForm({ ...passwordForm, nueva: e.target.value })}
              className="input-field"
              required
              minLength={12}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña *</label>
            <input
              type="password"
              value={passwordForm.confirmar}
              onChange={e => setPasswordForm({ ...passwordForm, confirmar: e.target.value })}
              className="input-field"
              required
              minLength={12}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalPassword(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Cambiar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

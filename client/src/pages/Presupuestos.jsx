import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiEye,
  FiTrash2,
  FiPrinter,
  FiFilter,
  FiDownload,
  FiEdit
} from 'react-icons/fi';

const ESTADOS = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aceptado: 'bg-blue-100 text-blue-700',
  en_curso: 'bg-indigo-100 text-indigo-700',
  finalizado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700'
};

export default function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [form, setForm] = useState({ paciente_id: '', doctor_id: '', cita_id: '', notas: '', descuento: '0'});
  const [detalles, setDetalles] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroPaciente) params.paciente_id = filtroPaciente;
      const { data } = await api.get('/presupuestos', { params });
      setPresupuestos(data);
    } catch {
      toast.error('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async () => {
  try {
    const [pacRes, docRes, tratRes, citasRes] = await Promise.all([
      api.get('/pacientes', { params: { limit: 1000 } }),
      api.get('/usuarios/doctores'),
      api.get('/tratamientos'),
      api.get('/citas')
    ]);

    setPacientes(pacRes.data.pacientes || []);
    setDoctores(docRes.data);
    setTratamientos(tratRes.data);
    setCitas(citasRes.data);

  } catch (err) {
    console.error(err);
    toast.error('Error cargando datos');
  }
};
  useEffect(() => { cargar(); }, [filtroEstado, filtroPaciente]);
  useEffect(() => { cargarDatos(); }, []);

  const agregarDetalle = () => {
    setDetalles([...detalles, { tratamiento_id: '', pieza_dental: '', precio: '' }]);
  };

  const actualizarDetalle = (idx, campo, valor) => {
    const nuevos = [...detalles];
    nuevos[idx][campo] = valor;
    if (campo === 'tratamiento_id') {
      const trat = tratamientos.find(t => t.id === parseInt(valor));
      if (trat) nuevos[idx].precio = trat.precio;
    }
    setDetalles(nuevos);
  };

  const eliminarDetalle = (idx) => {
    setDetalles(detalles.filter((_, i) => i !== idx));
  };

const guardar = async (e) => {

  e.preventDefault();

  if (detalles.length === 0) {
    toast.error('Agregue al menos un tratamiento');
    return;
  }

  try {

    const payload = {
      ...form,
      descuento: parseFloat(form.descuento) || 0,

      detalles: detalles.map(d => ({
        tratamiento_id: parseInt(d.tratamiento_id),

        pieza_dental: d.pieza_dental
          ? parseInt(d.pieza_dental)
          : null,

        precio: parseFloat(d.precio)
      }))
    };

    // EDITAR
    if (editandoId) {

      await api.put(
        `/presupuestos/${editandoId}`,
        payload
      );

      toast.success('Presupuesto actualizado');

    } else {

      // CREAR
      await api.post(
        '/presupuestos',
        payload
      );

      toast.success('Presupuesto creado');
    }

    setModal(false);

    setEditandoId(null);

    setForm({
      paciente_id: '',
      doctor_id: '',
      cita_id: '',
      notas: '',
      descuento: '0'
    });

    setDetalles([]);

    cargar();

  } catch (err) {

    console.error(err);

    toast.error(
      err.response?.data?.error ||
      'Error guardando presupuesto'
    );
  }
};
  const cambiarEstado = async (id, estado) => {

  try {

    const { data } = await api.get(`/presupuestos/${id}`);

    await api.put(`/presupuestos/${id}`, {
      paciente_id: data.paciente_id,
      doctor_id: data.doctor_id,
      cita_id: data.cita_id,
      descuento: data.descuento,
      notas: data.notas,
      detalles: data.detalles.map(d => ({
        tratamiento_id: d.tratamiento_id,
        pieza_dental: d.pieza_dental,
        precio: d.precio
      })),
      estado
    });

    toast.success('Estado actualizado');

    cargar();

  } catch (err) {

    console.error(err);

    toast.error('Error al cambiar estado');
  }
};

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    try {
      await api.delete(`/presupuestos/${id}`);
      toast.success('Presupuesto eliminado');
      cargar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

   const verDetalle = async (id) => {
    try {
      const { data } = await api.get(`/presupuestos/${id}`);
      setModalDetalle(data);
    } catch {
      toast.error('Error al cargar detalle');
    }
  };
  
    const editar = async (id) => {

  try {

    const { data } = await api.get(`/presupuestos/${id}`);

    setEditandoId(id);

    setForm({
      paciente_id: data.paciente_id || '',
      doctor_id: data.doctor_id || '',
      cita_id: data.cita_id || '',
      notas: data.notas || '',
      descuento: data.descuento || '0',
      estado: data.estado || 'pendiente'
    });

    setDetalles(
      (data.detalles || []).map(d => ({
        tratamiento_id: d.tratamiento_id,
        pieza_dental: d.pieza_dental || '',
        precio: d.precio
      }))
    );

    setModal(true);

  } catch (err) {

    console.error(err);

    toast.error('Error cargando presupuesto');
  }
};
   
 const imprimirPresupuesto = (p) => {
  const win = window.open('', '_blank', 'width=850,height=950');

  const filas = (p.detalles || []).map(d => `
    <tr>
      <td>${d.tratamiento?.nombre || ''}</td>
      <td style="text-align:center">${d.pieza_dental || '-'}</td>
      <td style="text-align:right">$${Number(d.precio).toLocaleString()}</td>
    </tr>
  `).join('');

  const totalPagado = (p.pagos || []).reduce((s, pa) => s + parseFloat(pa.monto), 0);
  const descuento = parseFloat(p.descuento || 0);
  const totalFinal = parseFloat(p.total) - totalPagado - descuento;

  win.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Presupuesto Premium #${p.id}</title>

<style>
  body{
    font-family: "Arial", sans-serif;
    margin:0;
    padding:0;
    background:#f8fafc;
    -webkit-print-color-adjust: exact;
print-color-adjust: exact;
  }

  /* WATERMARK */
  .watermark{
    position:fixed;
    top:30%;
    left:50%;
    transform:translate(-50%,-50%);
    opacity:0.5;
    font-size:80px;
    font-weight:bold;
    color:#c8a24a;
    z-index:0;
    pointer-events:none;
  }

  .container{
    position:relative;
    z-index:1;
    max-width:850px;
    margin:20px auto;
    background:#fff;
    padding:35px;
    border-radius:14px;
    box-shadow:0 15px 40px rgba(0,0,0,0.08);
  }

  /* HEADER LUXURY */
  .header{
    text-align:center;
    border-bottom:3px solid #c8a24a;
    padding-bottom:20px;
    margin-bottom:25px;
  }

  .logo{
    width:95px;
    height:95px;
    object-fit:contain;
    margin-bottom:10px;
  }

  .header h1{
    margin:0;
    font-size:24px;
    color:#c8a24a;
    letter-spacing:2px;
  }

  .header p{
    margin:4px 0;
    color:#6b7280;
    font-size:12px;
  }

  /* INFO */
  .info{
    display:grid;
    grid-template-columns:1fr 1fr 1fr;
    gap:12px;
    margin-bottom:20px;
  }

  .card{
    background:#fffaf0;
    border-left:4px solid #c8a24a;
    padding:12px;
    border-radius:10px;
  }

  .label{
    font-size:10px;
    text-transform:uppercase;
    color:#6b7280;
    letter-spacing:1px;
  }

  .value{
    font-size:14px;
    font-weight:bold;
    color:#111827;
    margin-top:4px;
  }

  /* TABLE LUXURY */
  table{
    width:100%;
    border-collapse:collapse;
    margin-top:10px;
  }

  th{
    background:linear-gradient(90deg,#c8a24a,#e2c275);
    color:white;
    padding:12px;
    font-size:12px;
    text-transform:uppercase;
  }

  td{
    padding:12px;
    border-bottom:1px solid #eee;
    font-size:13px;
  }

  /* TOTALS */
  .totales{
    margin-top:25px;
    text-align:right;
  }

  .totales div{
    margin:6px 0;
    font-size:14px;
    color:#374151;
  }

  .total-final{
    font-size:22px;
    font-weight:bold;
    color:#c8a24a;
    border-top:3px solid #c8a24a;
    padding-top:10px;
    margin-top:10px;
  }

  /* SIGNATURES */
  .firma{
    margin-top:70px;
    display:flex;
    justify-content:space-around;
  }

  .linea{
    border-top:1px solid #c8a24a;
    width:200px;
    text-align:center;
    padding-top:6px;
    font-size:12px;
    color:#6b7280;
  }

  /* FOOTER */
  .footer{
    margin-top:35px;
    text-align:center;
    font-size:11px;
    color:#9ca3af;
  }

  @media print{
    body{background:white}
    .container{box-shadow:none}
  }
</style>

</head>

<body>

<div class="watermark">ALMAR</div>

<div class="container">

  <!-- HEADER -->
  <div class="header">
    <img 
      src="/logo_clinica-removebg-preview.png"
      class="logo"
      alt="Clinica Dental Almar"
    />

    <h1>CLÍNICA DENTAL ALMAR</h1>
    <p>Presupuesto Odontológico Profesional</p>
    <p>🏢Av Óscar Pérez Escobosa Local 36, Fraccionamiento Hacienda del Seminario, 82129 Mazatlán, Sin.</p>
    <p>📞 669 113 0990</p>
  </div>

  <!-- INFO -->
  <div class="info">

    <div class="card">
      <div class="label">Paciente</div>
      <div class="value">${p.paciente?.nombre} ${p.paciente?.apellido}</div>
      <div style="font-size:12px;color:#6b7280">Número de Paciente: ${p.paciente?.dni || ''}</div>
    </div>

    <div class="card">
      <div class="label">Doctor</div>
      <div class="value">Dr. ${p.doctor?.nombre} ${p.doctor?.apellido}</div>
    </div>

    <div class="card">
      <div class="label">Fecha</div>
      <div class="value">${p.createdAt?.split('T')[0]}</div>
      <div style="font-size:12px;color:#6b7280">#${p.id}</div>
    </div>

  </div>

  <!-- TABLE -->
  <table>
    <thead>
      <tr>
        <th>Tratamiento</th>
        <th>Pieza Dental</th>
        <th>Precio</th>
      </tr>
    </thead>
    <tbody>
      ${filas}
    </tbody>
  </table>

  <!-- TOTALS -->
  <div class="totales">
    <div>Subtotal: $${Number(p.total).toLocaleString()}</div>

    ${descuento ? `<div>Descuento: -$${Number(descuento).toLocaleString()}</div>` : ''}

    ${totalPagado ? `<div>Pagado: -$${Number(totalPagado).toLocaleString()}</div>` : ''}

    <div class="total-final">
      TOTAL: $${Number(Math.max(0, totalFinal)).toLocaleString()}
    </div>
    <div class="valido">
      Este presupuesto es valido por 30 Días despues de su emisión.
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="firma">
    <div class="linea">Firma del Profesional</div>
    <div class="linea">Firma del Paciente</div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    Documento oficial · Clínica Dental Almar · Todos los derechos reservados®          
  </div>

</div>

<script>
  window.onload = () => window.print();
</script>

</body>
</html>
  `);

  win.document.close();
};  const total = detalles.reduce((s, d) => s + (parseFloat(d.precio) || 0), 0);
const exportarCSV = async () => {
  try {
    const params = new URLSearchParams();

    if (filtroEstado) {
      params.set('estado', filtroEstado);
    }

    if (filtroPaciente) {
      params.set('paciente_id', filtroPaciente);
    }

    const response = await api.get(
      `/exportar/presupuestos?${params.toString()}`,
      {
        responseType: 'blob'
      }
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', 'presupuestos.csv');

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);

    toast.success('CSV exportado');

  } catch (err) {
    console.error(err);
    toast.error('Error exportando CSV');
  }
};
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary-800">Presupuestos</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowFiltros(!showFiltros)} className={`btn-secondary flex items-center gap-1 ${(filtroEstado || filtroPaciente) ? 'ring-2 ring-primary-300' : ''}`}>
            <FiFilter size={16} /> Filtros
          </button>
         <button
  onClick={exportarCSV}
  className="btn-secondary flex items-center gap-2"
>
  <FiDownload size={16} /> CSV
</button>
          <button onClick={() => {
  setForm({
    paciente_id: '',
    doctor_id: '',
    cita_id: '',
    notas: '',
    descuento: '0'
  });

  setDetalles([]);
  setModalDetalle(null);
  setEditandoId(null);
  setModal(true);
}} className="btn-primary flex items-center gap-2"> <FiPlus size={16} /> Nuevo Presupuesto </button>
        </div>
      </div>

      {showFiltros && (
        <div className="card flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Estado</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input-field w-auto">
              <option value="">Todos</option>
              {Object.keys(ESTADOS).map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Paciente</label>
            <select value={filtroPaciente} onChange={e => setFiltroPaciente(e.target.value)} className="input-field w-auto">
              <option value="">Todos</option>
              {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>)}
            </select>
          </div>
          <button onClick={() => { setFiltroEstado(''); setFiltroPaciente(''); }} className="btn-secondary text-sm">Limpiar</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando...</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-modern">
            <thead>
              <tr>
                <th>#</th>
                <th>Paciente</th>
                <th>Doctor</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-surface-400">No hay presupuestos</td></tr>
              ) : presupuestos.map(p => (
                <tr key={p.id}>
                  <td className="text-surface-400 font-medium">#{p.id}</td>
                  <td className="font-semibold text-primary-900">{p.paciente?.nombre} {p.paciente?.apellido}</td>
                  <td className="text-surface-600">Dr. {p.doctor?.nombre} {p.doctor?.apellido}</td>
                  <td className="font-semibold text-dental-600">${Number(p.total).toLocaleString()}</td>
                  <td>
                    <select
                      value={p.estado}
                      onChange={(e) => cambiarEstado(p.id, e.target.value)}
                      className={`badge ${ESTADOS[p.estado]} border-0 cursor-pointer text-xs`}
                    >
                      {Object.keys(ESTADOS).map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="text-surface-500">{p.createdAt?.split('T')[0]}</td>
                <td className="min-w-[180px]">
                    <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                      <button onClick={() => editar(p.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Editar"> <FiEdit size={16} /></button>
                      <button onClick={() => verDetalle(p.id)} className="p-1 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors" title="Ver detalle"><FiEye size={16} /></button>
                      <button onClick={async () => { const { data } = await api.get(`/presupuestos/${p.id}`); imprimirPresupuesto(data); }} className="p-1 text-surface-500 hover:bg-surface-100 rounded-xl transition-colors" title="Imprimir"><FiPrinter size={16}  /></button>
                      <button onClick={() => eliminar(p.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Eliminar"><FiTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nuevo Presupuesto */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={ editandoId ? `Editar Presupuesto #${editandoId}` : 'Nuevo Presupuesto'} size="xl">
        <form onSubmit={guardar} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
            <div>
  <label className="block text-sm font-medium text-surface-600 mb-1">
    Cita Relacionada
  </label>

  <select
    value={form.cita_id}
    onChange={(e) => {
      const cita = citas.find(
        c => c.id === parseInt(e.target.value)
      );

      setForm({
        ...form,
        cita_id: e.target.value,
        paciente_id: cita?.paciente_id || '',
        doctor_id: cita?.doctor_id || ''
      });
    }}
    className="input-field"
  >
    <option value="">Sin cita</option>

    {citas
  .filter(c => {

    // SOLO citas del paciente seleccionado
    const mismoPaciente =
      Number(c.paciente_id) === Number(form.paciente_id);

    // citas ya usadas en otros presupuestos
    const citaYaUsada = presupuestos.some(p =>
      Number(p.cita_id) === Number(c.id) &&
      Number(p.id) !== Number(editandoId)
    );

    return mismoPaciente && !citaYaUsada;
  })
  .map(c => (
    <option key={c.id} value={c.id}>
      #{c.id} - {c.paciente?.nombre} {c.paciente?.apellido}
    </option>
))}
  </select>
</div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Paciente *</label>
              <select value={form.paciente_id} onChange={e => setForm({ ...form, paciente_id: e.target.value, cita_id: '' })} className="input-field" required>
                <option value="">Seleccionar</option>
                {pacientes.map(p => <option key={p.id} value={p.id}> {p.nombre} {p.apellido}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Doctor *</label>
              <select value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} className="input-field" required>
                <option value="">Seleccionar</option>
                {doctores.map(d => <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido}</option>)}
              </select>
            </div>
          </div>

          {/* Detalles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Tratamientos</label>
              <button type="button" onClick={agregarDetalle} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                <FiPlus size={14} /> Agregar
              </button>
            </div>
            {detalles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">Agregue tratamientos al presupuesto</p>
            ) : (
              <div className="space-y-2">
                {detalles.map((d, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select value={d.tratamiento_id} onChange={e => actualizarDetalle(i, 'tratamiento_id', e.target.value)} className="input-field text-sm" required>
                        <option value="">Tratamiento</option>
                        {tratamientos.map(t => <option key={t.id} value={t.id}>{t.nombre} - ${Number(t.precio).toLocaleString()}</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <input type="number" min="1" max="32" placeholder="Pieza" value={d.pieza_dental} onChange={e => actualizarDetalle(i, 'pieza_dental', e.target.value)} className="input-field text-sm" />
                    </div>
                    <div className="w-28">
                      <input type="number" step="0.01" placeholder="Precio" value={d.precio} onChange={e => actualizarDetalle(i, 'precio', e.target.value)} className="input-field text-sm" required />
                    </div>
                    <button type="button" onClick={() => eliminarDetalle(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs text-gray-500">Descuento</label>
                <input type="number" step="0.01" value={form.descuento} onChange={e => setForm({ ...form, descuento: e.target.value })} className="input-field w-28 text-sm" />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-green-700">${(total - (parseFloat(form.descuento) || 0)).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">
  {
    editandoId
      ? 'Guardar Cambios'
      : 'Crear Presupuesto'
  }
</button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle */}
      <Modal isOpen={!!modalDetalle} onClose={() => setModalDetalle(null)} title={`Presupuesto #${modalDetalle?.id}`} size="lg">
        {modalDetalle && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => imprimirPresupuesto(modalDetalle)} className="btn-secondary flex items-center gap-2 text-sm">
                <FiPrinter size={15} /> Imprimir Presupuesto
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Paciente:</span> <span className="font-medium">{modalDetalle.paciente?.nombre} {modalDetalle.paciente?.apellido}</span></div>
              <div><span className="text-gray-500">Doctor:</span> <span className="font-medium">Dr. {modalDetalle.doctor?.nombre} {modalDetalle.doctor?.apellido}</span></div>
            </div>
            <table className="table-modern">
              <thead><tr><th>Tratamiento</th><th>Pieza</th><th>Estado</th><th className="text-right">Precio</th></tr></thead>
              <tbody>
                {modalDetalle.detalles?.map(d => (
                  <tr key={d.id}>
                    <td className="font-medium text-primary-900">{d.tratamiento?.nombre}</td>
                    <td className="text-surface-600">{d.pieza_dental || '-'}</td>
                    <td><span className={`badge ${ESTADOS[modalDetalle.estado]}`}>{modalDetalle.estado.replace('_', ' ')}</span></td>
                    <td className="text-right font-medium text-dental-600">${Number(d.precio).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-surface-200 font-semibold">
                  <td colSpan={3} className="text-right">Total:</td>
                  <td className="text-right text-dental-600">${Number(modalDetalle.total).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
            {modalDetalle.pagos?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Pagos realizados</h4>
                {modalDetalle.pagos.map(p => (
                  <div key={p.id} className="flex justify-between text-sm p-3 bg-surface-50 rounded-xl mb-1.5 border border-surface-100">
                    <span>{p.fecha} - {p.metodo_pago?.replace('_', ' ')}</span>
                    <span className="font-medium">${Number(p.monto).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

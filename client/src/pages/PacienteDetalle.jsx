import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Odontograma from '../components/Odontograma';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiPrinter, FiCalendar } from 'react-icons/fi';

export default function PacienteDetalle() {
  const { id } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [odontograma, setOdontograma] = useState([]);
  const [historias, setHistorias] = useState([]);
  const [balance, setBalance] = useState(null);
  const [tab, setTab] = useState('info');
  const [modalHistoria, setModalHistoria] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [modalCita, setModalCita] = useState(false);
  const [doctores, setDoctores] = useState([]);
  const [formHistoria, setFormHistoria] = useState({ diagnostico: '', tratamiento_realizado: '', piezas_tratadas: '', receta: '', notas: '' });
  const [formPago, setFormPago] = useState({ monto: '', metodo_pago: 'efectivo', fecha: new Date().toISOString().split('T')[0], presupuesto_id: '', numero_recibo: '', notas: '' });
  const [formCita, setFormCita] = useState({ doctor_id: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '', hora_fin: '', motivo: '' });
  const [consentimientos, setConsentimientos] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [modalConsentimiento, setModalConsentimiento] = useState(false);
  const [formConsent, setFormConsent] = useState({ tipo: '', contenido: '' });
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    try {
      const [pacRes, odonRes, histRes, balRes, consRes] = await Promise.all([
        api.get(`/pacientes/${id}`),
        api.get(`/odontograma/${id}`),
        api.get(`/historia/${id}`),
        api.get(`/reportes/balance/${id}`),
        api.get(`/consentimiento/paciente/${id}`)
      ]);
      setPaciente(pacRes.data);
      setOdontograma(odonRes.data);
      setHistorias(histRes.data);
      setBalance(balRes.data);
      setConsentimientos(consRes.data);
    } catch {
      toast.error('Error al cargar datos del paciente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [id]);
  useEffect(() => {
    api.get('/usuarios/doctores').then(res => setDoctores(res.data)).catch(() => {});
    api.get('/consentimiento/plantillas').then(res => setPlantillas(res.data)).catch(() => {});
  }, []);

  const handleOdontograma = async (pieza, estado) => {
    try {
      await api.post('/odontograma', { paciente_id: parseInt(id), pieza_dental: pieza, estado, fecha: new Date().toISOString().split('T')[0] });
      const { data } = await api.get(`/odontograma/${id}`);
      setOdontograma(data);
      toast.success(`Pieza ${pieza} actualizada`);
    } catch {
      toast.error('Error al actualizar odontograma');
    }
  };

  const guardarHistoria = async (e) => {
    e.preventDefault();
    try {
      await api.post('/historia', { ...formHistoria, paciente_id: parseInt(id), fecha: new Date().toISOString().split('T')[0] });
      toast.success('Registro añadido');
      setModalHistoria(false);
      setFormHistoria({ diagnostico: '', tratamiento_realizado: '', piezas_tratadas: '', receta: '', notas: '' });
      const { data } = await api.get(`/historia/${id}`);
      setHistorias(data);
    } catch {
      toast.error('Error al guardar');
    }
  };

  const crearConsentimiento = async (e) => {
    e.preventDefault();
    try {
      await api.post('/consentimiento', { paciente_id: parseInt(id), tipo: formConsent.tipo, contenido: formConsent.contenido });
      toast.success('Consentimiento creado');
      setModalConsentimiento(false);
      const { data } = await api.get(`/consentimiento/paciente/${id}`);
      setConsentimientos(data);
    } catch { toast.error('Error al crear consentimiento'); }
  };

  const firmarConsentimiento = async (consentId) => {
    if (!confirm('¿Confirmar firma del consentimiento?')) return;
    try {
      await api.put(`/consentimiento/${consentId}/firmar`);
      toast.success('Consentimiento firmado');
      const { data } = await api.get(`/consentimiento/paciente/${id}`);
      setConsentimientos(data);
    } catch { toast.error('Error al firmar'); }
  };

  const imprimirConsentimiento = (c) => {
    const win = window.open('', '_blank', 'width=700,height=900');
    win.document.write(`<!DOCTYPE html><html><head><img src="/logo.png" style="width:80px;margin-bottom:10px;" /><title>Consentimiento - ${c.tipo}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;max-width:650px;margin:0 auto;color:#333;line-height:1.6}
    .header{text-align:center;border-bottom:2px solid #fcf0be;padding-bottom:15px;margin-bottom:25px}
    .header h1{margin:0;color:#fcf0be;font-size:20px}.header h2{margin:5px 0;font-size:16px;color:#333}
    .content{white-space:pre-wrap;font-size:13px;margin:20px 0}
    .firma-section{margin-top:50px;display:flex;justify-content:space-around}
    .firma-section div{text-align:center;width:200px}.firma-section .linea{border-top:1px solid #333;margin-top:60px;padding-top:5px;font-size:12px}
    .info{font-size:12px;color:#666;margin:10px 0}.estado{font-size:13px;margin:10px 0}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1>Clinica Dental Almar</h1><h2>Consentimiento Informado</h2><p style="font-size:12px;color:#666">${c.tipo}</p></div>
    <div class="info"><strong>Paciente:</strong> ${paciente.nombre} ${paciente.apellido} | <strong>DNI:</strong> ${paciente.dni}<br>
    <strong>Doctor:</strong> Dr. ${c.doctor?.nombre || ''} ${c.doctor?.apellido || ''} | <strong>Fecha:</strong> ${c.createdAt?.split('T')[0]}</div>
    <div class="content">${c.contenido}</div>
    ${c.firmado ? `<div class="estado"><strong>Estado:</strong> FIRMADO el ${new Date(c.fecha_firma).toLocaleDateString('es-AR')}</div>` : ''}
    <div class="firma-section"><div><div class="linea">Firma del profesional</div></div><div><div class="linea">Firma del paciente</div></div></div>
    <script>window.onload=function(){window.print()}</script></body></html>`);
    win.document.close();
  };

  const imprimirHistoria = () => {
    const win = window.open('', '_blank', 'width=700,height=900');
    const registros = historias.map(h => `
      <div class="registro">
        <div class="registro-header">${h.fecha} - Dr. ${h.doctor?.nombre || ''} ${h.doctor?.apellido || ''}</div>
        ${h.diagnostico ? `<p><strong>Diagnóstico:</strong> ${h.diagnostico}</p>` : ''}
        ${h.tratamiento_realizado ? `<p><strong>Tratamiento:</strong> ${h.tratamiento_realizado}</p>` : ''}
        ${h.piezas_tratadas ? `<p><strong>Piezas:</strong> ${h.piezas_tratadas}</p>` : ''}
        ${h.receta ? `<p><strong>Receta:</strong> ${h.receta}</p>` : ''}
        ${h.notas ? `<p class="notas">${h.notas}</p>` : ''}
      </div>
    `).join('');
    win.document.write(`<!DOCTYPE html><html><head><img src="/logo.png" style="width:80px;margin-bottom:10px;" /><title>Historia Clínica - ${paciente.apellido}, ${paciente.nombre}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#333;line-height:1.5}
      .header{text-align:center;border-bottom:3px solid #fcf0be;padding-bottom:15px;margin-bottom:20px}
      .header h1{margin:0;color:#fcf0be;font-size:22px}.header h2{margin:5px 0;font-size:16px;color:#333}
      .paciente-info{display:flex;justify-content:space-between;background:#f8fafc;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:13px}
      .registro{border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px;page-break-inside:avoid}
      .registro-header{font-weight:bold;color:#fcf0be;margin-bottom:8px;font-size:13px;border-bottom:1px solid #f1f5f9;padding-bottom:6px}
      .registro p{margin:4px 0;font-size:12px}.notas{color:#666;font-style:italic}
      .footer{text-align:center;margin-top:30px;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:10px}
      @media print{body{padding:20px}}
    </style></head><body>
    <div class="header"><h1>Clinica Dental Almar</h1><h2>Historia Clínica</h2></div>
    <div class="paciente-info">
      <div><strong>Paciente:</strong> ${paciente.apellido}, ${paciente.nombre}</div>
      <div><strong>DNI:</strong> ${paciente.dni}</div>
      <div><strong>Edad:</strong> ${edad !== null ? edad + ' años' : '-'}</div>
    </div>
    ${paciente.alergias ? `<p style="font-size:12px;color:red;margin-bottom:15px"><strong>⚠ Alergias:</strong> ${paciente.alergias}</p>` : ''}
    ${paciente.antecedentes_medicos ? `<p style="font-size:12px;margin-bottom:15px"><strong>Antecedentes:</strong> ${paciente.antecedentes_medicos}</p>` : ''}
    ${registros || '<p style="text-align:center;color:#999">Sin registros</p>'}
    <div class="footer">Total: ${historias.length} registros | Impreso: ${new Date().toLocaleDateString('es-AR')}</div>
    <script>window.onload=function(){window.print()}</script></body></html>`);
    win.document.close();
  };

  const crearCita = async (e) => {
    e.preventDefault();
    try {
      await api.post('/citas', { ...formCita, paciente_id: parseInt(id) });
      toast.success('Cita agendada');
      setModalCita(false);
      setFormCita({ doctor_id: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '', hora_fin: '', motivo: '' });
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear cita');
    }
  };

  const registrarPago = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pagos', {
        paciente_id: parseInt(id),
        monto: parseFloat(formPago.monto),
        metodo_pago: formPago.metodo_pago,
        fecha: formPago.fecha,
        presupuesto_id: formPago.presupuesto_id || null,
        numero_recibo: formPago.numero_recibo || null,
        notas: formPago.notas || null
      });
      toast.success('Pago registrado');
      setModalPago(false);
      setFormPago({ monto: '', metodo_pago: 'efectivo', fecha: new Date().toISOString().split('T')[0], presupuesto_id: '', numero_recibo: '', notas: '' });
      cargar();
    } catch {
      toast.error('Error al registrar pago');
    }
  };

  const imprimirRecibo = (pago) => {
    const recibo = window.open('', '_blank', 'width=400,height=600');
    recibo.document.write(`
      <!DOCTYPE html><html><head><img src="/logo.png" style="width:80px;margin-bottom:10px;" /><title>Recibo de Pago</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; max-width: 380px; margin: 0 auto; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #fcf0be; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #fcf0be; font-size: 22px; }
        .header p { margin: 4px 0; color: #666; font-size: 12px; }
        .info { margin: 15px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #ddd; font-size: 13px; }
        .info-row .label { color: #666; }
        .info-row .value { font-weight: bold; }
        .total { text-align: center; margin: 25px 0; padding: 15px; background: #f0f9ff; border-radius: 8px; }
        .total .amount { font-size: 32px; font-weight: bold; color: #fcf0be; }
        .total .label { font-size: 12px; color: #666; }
        .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
        @media print { body { padding: 15px; } }
      </style></head><body>
        <div class="header"><img src="/logo.png" style="width:80px;margin-bottom:10px;" />
          <h1>Clinica Dental Almar</h1>
          <p>Clínica Odontológica</p>
          <p>Recibo de Pago</p>
        </div>
        <div class="total">
          <div class="label">MONTO RECIBIDO</div>
          <div class="amount">$${Number(pago.monto).toLocaleString()}</div>
        </div>
        <div class="info">
          <div class="info-row"><span class="label">Paciente</span><span class="value">${paciente.nombre} ${paciente.apellido}</span></div>
          <div class="info-row"><span class="label">DNI</span><span class="value">${paciente.dni}</span></div>
          <div class="info-row"><span class="label">Fecha</span><span class="value">${pago.fecha}</span></div>
          <div class="info-row"><span class="label">Método</span><span class="value">${pago.metodo_pago?.replace('_', ' ')}</span></div>
          ${pago.numero_recibo ? `<div class="info-row"><span class="label">N° Recibo</span><span class="value">${pago.numero_recibo}</span></div>` : ''}
          ${pago.notas ? `<div class="info-row"><span class="label">Notas</span><span class="value">${pago.notas}</span></div>` : ''}
        </div>
        <div class="footer">
          <p>¡Gracias por su pago y su preferencia!</p>
          <p>Fecha de impresión: ${new Date().toLocaleDateString('es-AR')}</p>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `);
    recibo.document.close();
  };

  if (loading) return <div className="text-center py-10 text-surface-400">Cargando...</div>;
  if (!paciente) return <div className="text-center py-10 text-surface-400">Paciente no encontrado</div>;

  const tabs = [
    { key: 'info', label: 'Información' },
    { key: 'odontograma', label: 'Odontograma' },
    { key: 'historia', label: 'Historia Clínica' },
    { key: 'consentimientos', label: 'Consentimientos' },
    { key: 'balance', label: 'Cuenta Corriente' },
    { key: 'citas', label: 'Citas' },
    { key: 'pagos', label: 'Pagos' }
  ];

  const edad = paciente.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(paciente.fecha_nacimiento)) / 31557600000)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/pacientes" className="p-2.5 hover:bg-white/80 rounded-xl border border-surface-200 transition-all hover:shadow-sm"><FiArrowLeft size={20} className="text-surface-600" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary-800">{paciente.apellido}, {paciente.nombre}</h1>
          <p className="text-surface-500">DNI: {paciente.dni} {edad !== null && `| ${edad} años`}</p>
        </div>
        {balance && (
          <div className={`text-right px-5 py-3 rounded-2xl ${balance.saldo > 0 ? 'bg-red-50 border border-red-200' : 'bg-dental-50 border border-dental-200'}`}>
            <p className="text-xs text-surface-500">Saldo</p>
            <p className={`text-lg font-bold ${balance.saldo > 0 ? 'text-red-600' : 'text-dental-600'}`}>
              {balance.saldo > 0 ? `Debe: $${Number(balance.saldo).toLocaleString()}` : 'Al día'}
            </p>
          </div>
        )}
      </div>

      {/* Próxima cita reminder */}
      {(() => {
        const hoy = new Date().toISOString().split('T')[0];
        const proxima = paciente.citas
          ?.filter(c => c.fecha >= hoy && (c.estado === 'programada' || c.estado === 'confirmada'))
          .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))[0];
        if (!proxima) return null;
        const esHoy = proxima.fecha === hoy;
        return (
          <div className={`flex items-center gap-3 p-4 rounded-2xl ${esHoy ? 'bg-dental-50 border border-dental-200' : 'bg-primary-50 border border-primary-200'}`}>
            <FiCalendar className={esHoy ? 'text-dental-600' : 'text-primary-600'} size={20} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${esHoy ? 'text-dental-800' : 'text-primary-800'}`}>
                {esHoy ? 'Cita HOY' : 'Próxima cita'}: {proxima.fecha} a las {proxima.hora_inicio?.slice(0,5)}
              </p>
              <p className="text-xs text-surface-600">
                {proxima.doctor && `Dr. ${proxima.doctor.apellido}`}
                {proxima.motivo && ` - ${proxima.motivo}`}
                {' · '}{proxima.estado}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-2xl w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-primary-700 shadow-md' : 'text-surface-500 hover:text-primary-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Info */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-primary-900 mb-4">Datos Personales</h3>
            <dl className="space-y-3 text-sm">
              {[
                ['Teléfono', paciente.telefono],
                ['Email', paciente.email],
                ['Dirección', paciente.direccion],
                ['Género', paciente.genero],
                ['Fecha Nac.', paciente.fecha_nacimiento],
                ['Obra Social', paciente.obra_social],
                ['N° Afiliado', paciente.numero_afiliado]
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-surface-100 last:border-0">
                  <dt className="text-surface-500">{label}</dt>
                  <dd className="font-medium text-primary-900">{value || '-'}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card">
            <h3 className="font-semibold text-primary-900 mb-4">Información Médica</h3>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-surface-500 mb-1">Antecedentes Médicos</dt><dd className="text-primary-900">{paciente.antecedentes_medicos || 'Sin antecedentes'}</dd></div>
              <div><dt className="text-surface-500 mb-1">Alergias</dt><dd className="text-red-600 font-medium">{paciente.alergias || 'Sin alergias conocidas'}</dd></div>
              <div><dt className="text-surface-500 mb-1">Medicamentos</dt><dd className="text-primary-900">{paciente.medicamentos || 'Ninguno'}</dd></div>
              <div><dt className="text-surface-500 mb-1">Notas</dt><dd className="text-primary-900">{paciente.notas || '-'}</dd></div>
            </dl>
          </div>
        </div>
      )}

      {/* Tab Odontograma */}
      {tab === 'odontograma' && (
        <div className="card">
          <h3 className="font-semibold text-primary-900 mb-4">Odontograma Digital</h3>
          <Odontograma registros={odontograma} onPiezaClick={handleOdontograma} />
        </div>
      )}

      {/* Tab Historia */}
      {tab === 'historia' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setModalHistoria(true)} className="btn-primary flex items-center gap-2">
              <FiPlus size={16} /> Nuevo Registro
            </button>
            {historias.length > 0 && (
              <button onClick={imprimirHistoria} className="btn-secondary flex items-center gap-2">
                <FiPrinter size={16} /> Imprimir Historia
              </button>
            )}
          </div>
          {historias.length === 0 ? (
            <div className="card text-center text-gray-500">Sin registros en historia clínica</div>
          ) : historias.map(h => (
            <div key={h.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-surface-500 font-medium">{h.fecha} - Dr. {h.doctor?.nombre} {h.doctor?.apellido}</p>
              </div>
              {h.diagnostico && <p className="text-sm"><span className="font-medium">Diagnóstico:</span> {h.diagnostico}</p>}
              {h.tratamiento_realizado && <p className="text-sm"><span className="font-medium">Tratamiento:</span> {h.tratamiento_realizado}</p>}
              {h.piezas_tratadas && <p className="text-sm"><span className="font-medium">Piezas:</span> {h.piezas_tratadas}</p>}
              {h.receta && <p className="text-sm"><span className="font-medium">Receta:</span> {h.receta}</p>}
              {h.notas && <p className="text-sm text-surface-500 mt-1 italic">{h.notas}</p>}
            </div>
          ))}

          <Modal isOpen={modalHistoria} onClose={() => setModalHistoria(false)} title="Nueva Entrada - Historia Clínica" size="lg">
            <form onSubmit={guardarHistoria} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Diagnóstico</label>
                <textarea value={formHistoria.diagnostico} onChange={e => setFormHistoria({ ...formHistoria, diagnostico: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Tratamiento Realizado</label>
                <textarea value={formHistoria.tratamiento_realizado} onChange={e => setFormHistoria({ ...formHistoria, tratamiento_realizado: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Piezas Tratadas</label>
                <input value={formHistoria.piezas_tratadas} onChange={e => setFormHistoria({ ...formHistoria, piezas_tratadas: e.target.value })} className="input-field" placeholder="Ej: 11, 21, 36" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Receta</label>
                <textarea value={formHistoria.receta} onChange={e => setFormHistoria({ ...formHistoria, receta: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Notas</label>
                <textarea value={formHistoria.notas} onChange={e => setFormHistoria({ ...formHistoria, notas: e.target.value })} className="input-field" rows={2} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setModalHistoria(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* Tab Consentimientos */}
      {tab === 'consentimientos' && (
        <div className="space-y-4">
          <button onClick={() => { setFormConsent({ tipo: '', contenido: '' }); setModalConsentimiento(true); }} className="btn-primary flex items-center gap-2">
            <FiPlus size={16} /> Nuevo Consentimiento
          </button>
          {consentimientos.length === 0 ? (
            <div className="card text-center text-gray-500">No hay consentimientos registrados</div>
          ) : consentimientos.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-primary-900">{c.tipo}</h4>
                  <p className="text-sm text-surface-500">
                    {c.createdAt?.split('T')[0]} - Dr. {c.doctor?.nombre} {c.doctor?.apellido}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.firmado ? (
                    <span className="badge bg-green-100 text-green-700">Firmado {c.fecha_firma ? new Date(c.fecha_firma).toLocaleDateString('es-AR') : ''}</span>
                  ) : (
                    <button onClick={() => firmarConsentimiento(c.id)} className="btn-success text-xs px-3 py-1">
                      Firmar
                    </button>
                  )}
                  <button onClick={() => imprimirConsentimiento(c)} className="p-1 text-primary-600 hover:bg-primary-50 rounded" title="Imprimir">
                    <FiPrinter size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-surface-700 whitespace-pre-wrap line-clamp-3">{c.contenido}</p>
            </div>
          ))}

          <Modal isOpen={modalConsentimiento} onClose={() => setModalConsentimiento(false)} title="Nuevo Consentimiento Informado" size="lg">
            <form onSubmit={crearConsentimiento} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Plantilla</label>
                <select
                  className="input-field"
                  onChange={e => {
                    const p = plantillas.find(pl => pl.tipo === e.target.value);
                    if (p) setFormConsent({ tipo: p.tipo, contenido: p.contenido });
                  }}
                >
                  <option value="">Seleccionar plantilla...</option>
                  {plantillas.map(p => <option key={p.tipo} value={p.tipo}>{p.tipo}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Tipo *</label>
                <input value={formConsent.tipo} onChange={e => setFormConsent({ ...formConsent, tipo: e.target.value })} className="input-field" required placeholder="Ej: Extracción Dental" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Contenido *</label>
                <textarea value={formConsent.contenido} onChange={e => setFormConsent({ ...formConsent, contenido: e.target.value })} className="input-field" rows={10} required />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setModalConsentimiento(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Crear Consentimiento</button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* Tab Balance / Cuenta Corriente */}
      {tab === 'balance' && balance && (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card flex-col justify-center text-center">
              <p className="text-sm text-surface-500">Total Presupuestado</p>
              <p className="text-2xl font-bold text-primary-700">${Number(balance.totalPresupuestado).toLocaleString()}</p>
            </div>
            <div className="stat-card flex-col justify-center text-center">
              <p className="text-sm text-surface-500">Total Pagado</p>
              <p className="text-2xl font-bold text-dental-600">${Number(balance.totalPagado).toLocaleString()}</p>
            </div>
            <div className={`stat-card flex-col justify-center text-center ${balance.saldo > 0 ? '!bg-red-50 !border-red-200' : '!bg-dental-50 !border-dental-200'}`}>
              <p className="text-sm text-surface-500">Saldo Pendiente</p>
              <p className={`text-2xl font-bold ${balance.saldo > 0 ? 'text-red-600' : 'text-dental-600'}`}>
                ${Number(Math.max(0, balance.saldo)).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          {balance.totalPresupuestado > 0 && (
            <div className="card">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-surface-600">Progreso de pago</span>
                <span className="font-semibold text-primary-700">{Math.min(100, ((balance.totalPagado / balance.totalPresupuestado) * 100)).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-surface-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-dental-500 to-dental-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (balance.totalPagado / balance.totalPresupuestado) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Botón registrar pago */}
          <button onClick={() => setModalPago(true)} className="btn-primary flex items-center gap-2">
            <FiPlus size={16} /> Registrar Pago
          </button>

          {/* Detalle por presupuesto */}
          {balance.presupuestos?.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-primary-900">Detalle por Presupuesto</h3>
              {balance.presupuestos.map(p => {
                const pendiente = parseFloat(p.total) - p.pagado;
                const pctPagado = parseFloat(p.total) > 0 ? (p.pagado / parseFloat(p.total)) * 100 : 0;
                return (
                  <div key={p.id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-medium text-gray-900">Presupuesto #{p.id}</span>
                        <span className={`ml-2 badge ${
                          p.estado === 'aceptado' ? 'bg-blue-100 text-blue-700' :
                          p.estado === 'en_curso' ? 'bg-indigo-100 text-indigo-700' :
                          p.estado === 'finalizado' ? 'bg-green-100 text-green-700' :
                          p.estado === 'rechazado' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{p.estado?.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right text-sm">
                        <span className="text-dental-600 font-medium">${Number(p.pagado).toLocaleString()}</span>
                        <span className="text-surface-400"> / </span>
                        <span className="text-primary-900 font-medium">${Number(p.total).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-200 rounded-full h-2 mb-3">
                      <div className="bg-gradient-to-r from-dental-500 to-dental-400 h-full rounded-full" style={{ width: `${Math.min(100, pctPagado)}%` }} />
                    </div>
                    {pendiente > 0 && (
                      <p className="text-sm text-red-600">Pendiente: ${Number(pendiente).toLocaleString()}</p>
                    )}
                    {p.detalles?.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {p.detalles.map(d => (
                          <div key={d.id} className="flex justify-between text-sm text-surface-600 py-1.5 border-t border-surface-100">
                            <span>{d.tratamiento?.nombre} {d.pieza_dental ? `(pieza ${d.pieza_dental})` : ''}</span>
                            <span>${Number(d.precio).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Pago */}
          <Modal isOpen={modalPago} onClose={() => setModalPago(false)} title="Registrar Pago">
            <form onSubmit={registrarPago} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Monto *</label>
                  <input type="number" step="0.01" value={formPago.monto} onChange={e => setFormPago({ ...formPago, monto: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Fecha *</label>
                  <input type="date" value={formPago.fecha} onChange={e => setFormPago({ ...formPago, fecha: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Método *</label>
                  <select value={formPago.metodo_pago} onChange={e => setFormPago({ ...formPago, metodo_pago: e.target.value })} className="input-field" required>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta_debito">Tarjeta Débito</option>
                    <option value="tarjeta_credito">Tarjeta Crédito</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">N° Recibo</label>
                  <input value={formPago.numero_recibo} onChange={e => setFormPago({ ...formPago, numero_recibo: e.target.value })} className="input-field" />
                </div>
              </div>
              {balance.presupuestos?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Asociar a presupuesto</label>
                  <select value={formPago.presupuesto_id} onChange={e => setFormPago({ ...formPago, presupuesto_id: e.target.value })} className="input-field">
                    <option value="">Sin asociar</option>
                    {balance.presupuestos.map(p => (
                      <option key={p.id} value={p.id}>#{p.id} - ${Number(p.total).toLocaleString()} ({p.estado})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Notas</label>
                <textarea value={formPago.notas} onChange={e => setFormPago({ ...formPago, notas: e.target.value })} className="input-field" rows={2} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setModalPago(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Registrar Pago</button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* Tab Citas */}
      {tab === 'citas' && (
        <div className="space-y-4">
          <button onClick={() => setModalCita(true)} className="btn-primary flex items-center gap-2">
            <FiCalendar size={16} /> Agendar Cita
          </button>
          <div className="card">
          <h3 className="font-semibold text-primary-900 mb-4">Historial de Citas</h3>
          {!paciente.citas?.length ? (
            <p className="text-gray-500 text-sm">Sin citas registradas</p>
          ) : (
            <div className="space-y-2">
              {paciente.citas.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3.5 bg-surface-50 rounded-2xl text-sm border border-surface-100">
                  <div>
                    <span className="font-semibold text-primary-800">{c.fecha}</span> - {c.hora_inicio?.slice(0,5)}
                    <span className="ml-2 text-surface-500">{c.motivo || 'Consulta'}</span>
                    {c.doctor && <span className="ml-2 text-surface-400">- Dr. {c.doctor.apellido}</span>}
                  </div>
                  <span className={`badge ${
                    c.estado === 'completada' ? 'bg-green-100 text-green-700' :
                    c.estado === 'cancelada' ? 'bg-red-100 text-red-700' :
                    c.estado === 'no_asistio' ? 'bg-gray-100 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {c.estado?.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
          </div>

          {/* Modal Cita Rápida */}
          <Modal isOpen={modalCita} onClose={() => setModalCita(false)} title="Agendar Cita">
            <form onSubmit={crearCita} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Doctor *</label>
                <select value={formCita.doctor_id} onChange={e => setFormCita({ ...formCita, doctor_id: e.target.value })} className="input-field" required>
                  <option value="">Seleccionar doctor</option>
                  {doctores.map(d => <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido} - {d.especialidad || 'General'}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Fecha *</label>
                  <input type="date" value={formCita.fecha} onChange={e => setFormCita({ ...formCita, fecha: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Hora inicio *</label>
                  <input type="time" value={formCita.hora_inicio} onChange={e => setFormCita({ ...formCita, hora_inicio: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Hora fin</label>
                  <input type="time" value={formCita.hora_fin} onChange={e => setFormCita({ ...formCita, hora_fin: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Motivo</label>
                <input value={formCita.motivo} onChange={e => setFormCita({ ...formCita, motivo: e.target.value })} className="input-field" placeholder="Ej: Control, Limpieza, Ortodoncia..." />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setModalCita(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Agendar</button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* Tab Pagos */}
      {tab === 'pagos' && (
        <div className="card">
          <h3 className="font-semibold text-primary-900 mb-4">Historial de Pagos</h3>
          {!paciente.pagos?.length ? (
            <p className="text-gray-500 text-sm">Sin pagos registrados</p>
          ) : (
            <table className="table-modern">
              <thead><tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Recibo</th><th></th></tr></thead>
              <tbody>
                {paciente.pagos.map(p => (
                  <tr key={p.id}>
                    <td className="text-surface-600">{p.fecha}</td>
                    <td className="font-semibold text-dental-600">${Number(p.monto).toLocaleString()}</td>
                    <td><span className="badge bg-primary-50 text-primary-700 capitalize">{p.metodo_pago?.replace('_', ' ')}</span></td>
                    <td className="text-surface-500">{p.numero_recibo || '-'}</td>
                    <td className="py-2">
                      <button onClick={() => imprimirRecibo(p)} className="p-1 text-primary-600 hover:bg-primary-50 rounded" title="Imprimir recibo">
                        <FiPrinter size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

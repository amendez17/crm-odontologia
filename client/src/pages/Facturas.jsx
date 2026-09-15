import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiDownload, FiFileText, FiSearch, FiSlash, FiUpload } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const fechaHoraLocal = () => {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  return ahora.toISOString().slice(0, 16);
};

const formInicial = pago => ({
  uuid_fiscal: '', serie: '', folio: '', rfc_receptor: '', razon_social: '',
  fecha_timbrado: fechaHoraLocal(), total: pago ? String(pago.monto) : '', notas: '', xml: null, pdf: null
});

const fechaMx = valor => valor ? new Date(valor).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
const dinero = valor => Number(valor || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

export default function Facturas() {
  const { usuario } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [vista, setVista] = useState('pendientes');
  const [pendientes, setPendientes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todas');
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [form, setForm] = useState(formInicial());
  const [guardando, setGuardando] = useState(false);
  const [facturaCancelar, setFacturaCancelar] = useState(null);
  const [motivo, setMotivo] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const [pendientesRes, historialRes] = await Promise.all([
        api.get('/facturas/pendientes'), api.get('/facturas')
      ]);
      setPendientes(pendientesRes.data);
      setFacturas(historialRes.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'No fue posible cargar las facturas');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const pagoId = Number(searchParams.get('pago'));
    if (!pagoId || !pendientes.length || pagoSeleccionado) return;
    const pago = pendientes.find(item => item.id === pagoId);
    if (pago) abrirRegistro(pago);
  }, [pendientes, searchParams]);

  const abrirRegistro = pago => {
    setPagoSeleccionado(pago);
    setForm(formInicial(pago));
  };

  const cerrarRegistro = () => {
    setPagoSeleccionado(null);
    setForm(formInicial());
    if (searchParams.has('pago')) { searchParams.delete('pago'); setSearchParams(searchParams, { replace: true }); }
  };

  const guardarFactura = async event => {
    event.preventDefault();
    if (!pagoSeleccionado) return;
    setGuardando(true);
    try {
      const data = new FormData();
      ['uuid_fiscal', 'serie', 'folio', 'rfc_receptor', 'razon_social', 'fecha_timbrado', 'total', 'notas']
        .forEach(campo => data.append(campo, form[campo] || ''));
      if (form.xml) data.append('xml', form.xml);
      if (form.pdf) data.append('pdf', form.pdf);
      await api.post(`/facturas/pago/${pagoSeleccionado.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Factura timbrada registrada');
      cerrarRegistro();
      setVista('historial');
      await cargar();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No fue posible registrar la factura');
    } finally { setGuardando(false); }
  };

  const cancelarFactura = async event => {
    event.preventDefault();
    try {
      await api.put(`/facturas/${facturaCancelar.id}/cancelar`, { motivo });
      toast.success('Factura cancelada; el pago volvió a pendientes');
      setFacturaCancelar(null); setMotivo('');
      await cargar();
    } catch (error) { toast.error(error.response?.data?.error || 'No fue posible cancelar la factura'); }
  };

  const filtradas = useMemo(() => facturas.filter(factura => {
    if (estado !== 'todas' && factura.estado !== estado) return false;
    if (!busqueda.trim()) return true;
    const texto = `${factura.uuid_fiscal} ${factura.rfc_receptor} ${factura.razon_social} ${factura.folio || ''} ${factura.paciente?.nombre || ''} ${factura.paciente?.apellido || ''}`.toLowerCase();
    return texto.includes(busqueda.trim().toLowerCase());
  }), [facturas, estado, busqueda]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Facturas</h1>
        <p className="mt-1 text-sm text-surface-500">Control de solicitudes, timbrados, comprobantes y cancelaciones.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <button onClick={() => setVista('pendientes')} className={`rounded-xl border px-4 py-3 text-left ${vista === 'pendientes' ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-surface-200 bg-white text-surface-600'}`}>
          <span className="block text-xs font-semibold uppercase">Pendientes</span><span className="text-2xl font-bold">{pendientes.length}</span>
        </button>
        <button onClick={() => setVista('historial')} className={`rounded-xl border px-4 py-3 text-left ${vista === 'historial' ? 'border-primary-400 bg-primary-50 text-primary-800' : 'border-surface-200 bg-white text-surface-600'}`}>
          <span className="block text-xs font-semibold uppercase">Historial</span><span className="text-2xl font-bold">{facturas.length}</span>
        </button>
      </div>

      {loading ? <div className="card py-12 text-center text-surface-500">Cargando facturas...</div> : vista === 'pendientes' ? (
        <div className="space-y-3">
          {!pendientes.length ? <div className="card py-12 text-center"><FiCheckCircle className="mx-auto mb-2 text-3xl text-green-500" /><p className="font-semibold text-primary-900">No hay facturas pendientes</p></div> : pendientes.map(pago => (
            <div key={pago.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-primary-900">{pago.paciente?.nombre} {pago.paciente?.apellido}</p>
                <p className="text-sm text-surface-500">Pago del {new Date(`${pago.fecha}T12:00:00`).toLocaleDateString('es-MX')} · {dinero(pago.monto)}</p>
                <p className="text-xs text-surface-400">Recibo: {pago.numero_recibo || 'Sin número'}</p>
              </div>
              <button onClick={() => abrirRegistro(pago)} className="btn-primary inline-flex items-center justify-center gap-2"><FiFileText /> Registrar timbrado</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1"><FiSearch className="absolute left-3 top-3.5 text-surface-400" /><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar paciente, RFC, UUID o folio" className="input-field pl-10" /></label>
            <select value={estado} onChange={e => setEstado(e.target.value)} className="input-field sm:w-48"><option value="todas">Todos los estados</option><option value="timbrada">Timbradas</option><option value="cancelada">Canceladas</option></select>
          </div>

          {!filtradas.length ? <div className="card py-12 text-center text-surface-500">No se encontraron facturas.</div> : <>
            <div className="hidden overflow-x-auto rounded-2xl border border-surface-200 bg-white md:block">
              <table className="table-modern"><thead><tr><th>Timbrado</th><th>Paciente / receptor</th><th>UUID / folio</th><th>Total</th><th>Estado</th><th>Archivos</th><th></th></tr></thead>
                <tbody>{filtradas.map(factura => <tr key={factura.id}>
                  <td className="text-sm text-surface-600">{fechaMx(factura.fecha_timbrado)}</td>
                  <td><p className="font-semibold text-primary-900">{factura.paciente?.nombre} {factura.paciente?.apellido}</p><p className="text-xs text-surface-500">{factura.razon_social} · {factura.rfc_receptor}</p></td>
                  <td><p className="max-w-[220px] truncate font-mono text-xs" title={factura.uuid_fiscal}>{factura.uuid_fiscal}</p><p className="text-xs text-surface-500">{[factura.serie, factura.folio].filter(Boolean).join('-') || 'Sin folio interno'}</p></td>
                  <td className="font-semibold text-dental-600">{dinero(factura.total)}</td>
                  <td><span className={`badge ${factura.estado === 'timbrada' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{factura.estado}</span></td>
                  <td><div className="flex gap-2">{factura.xml_url && <a href={factura.xml_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary-700"><FiDownload className="inline" /> XML</a>}{factura.pdf_url && <a href={factura.pdf_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary-700"><FiDownload className="inline" /> PDF</a>}{!factura.xml_url && !factura.pdf_url && <span className="text-xs text-surface-400">Sin archivos</span>}</div></td>
                  <td>{usuario?.rol === 'administrador' && factura.estado === 'timbrada' && <button onClick={() => setFacturaCancelar(factura)} className="p-2 text-red-600" title="Registrar cancelación"><FiSlash /></button>}</td>
                </tr>)}</tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">{filtradas.map(factura => <article key={factura.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-primary-900">{factura.paciente?.nombre} {factura.paciente?.apellido}</p><p className="text-xs text-surface-500">{fechaMx(factura.fecha_timbrado)}</p></div><span className={`badge ${factura.estado === 'timbrada' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{factura.estado}</span></div>
              <div className="rounded-xl bg-surface-50 p-3 text-sm"><p>{factura.razon_social}</p><p className="text-surface-500">RFC: {factura.rfc_receptor}</p><p className="mt-1 break-all font-mono text-xs text-surface-500">UUID: {factura.uuid_fiscal}</p></div>
              <div className="flex items-center justify-between"><strong className="text-dental-600">{dinero(factura.total)}</strong><div className="flex gap-3">{factura.xml_url && <a href={factura.xml_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary-700">XML</a>}{factura.pdf_url && <a href={factura.pdf_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary-700">PDF</a>}{usuario?.rol === 'administrador' && factura.estado === 'timbrada' && <button onClick={() => setFacturaCancelar(factura)} className="text-sm font-semibold text-red-600">Cancelar</button>}</div></div>
              {factura.estado === 'cancelada' && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">Motivo: {factura.motivo_cancelacion}</p>}
            </article>)}</div>
          </>}
        </div>
      )}

      <Modal isOpen={Boolean(pagoSeleccionado)} onClose={cerrarRegistro} title="Registrar factura timbrada">
        {pagoSeleccionado && <form onSubmit={guardarFactura} className="space-y-4">
          <div className="rounded-xl bg-primary-50 p-3 text-sm"><strong>{pagoSeleccionado.paciente?.nombre} {pagoSeleccionado.paciente?.apellido}</strong><span className="block text-primary-700">Pago: {dinero(pagoSeleccionado.monto)}</span></div>
          <div><label className="mb-1 block text-sm font-medium">UUID fiscal *</label><input value={form.uuid_fiscal} onChange={e => setForm({ ...form, uuid_fiscal: e.target.value.toUpperCase() })} className="input-field font-mono uppercase" maxLength={36} required /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-sm font-medium">Serie</label><input value={form.serie} onChange={e => setForm({ ...form, serie: e.target.value })} className="input-field" maxLength={25} /></div><div><label className="mb-1 block text-sm font-medium">Folio</label><input value={form.folio} onChange={e => setForm({ ...form, folio: e.target.value })} className="input-field" maxLength={50} /></div></div>
          <div><label className="mb-1 block text-sm font-medium">RFC receptor *</label><input value={form.rfc_receptor} onChange={e => setForm({ ...form, rfc_receptor: e.target.value.toUpperCase() })} className="input-field uppercase" maxLength={13} required /></div>
          <div><label className="mb-1 block text-sm font-medium">Razón social *</label><input value={form.razon_social} onChange={e => setForm({ ...form, razon_social: e.target.value })} className="input-field" maxLength={255} required /></div>
          <div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Fecha de timbrado *</label><input type="datetime-local" value={form.fecha_timbrado} onChange={e => setForm({ ...form, fecha_timbrado: e.target.value })} className="input-field" required /></div><div><label className="mb-1 block text-sm font-medium">Total *</label><input type="number" value={form.total} className="input-field bg-surface-50" readOnly /></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="rounded-xl border border-dashed border-surface-300 p-3 text-sm"><span className="flex items-center gap-2 font-semibold"><FiUpload /> XML (opcional)</span><input type="file" accept=".xml,application/xml,text/xml" onChange={e => setForm({ ...form, xml: e.target.files?.[0] || null })} className="mt-2 block w-full text-xs" /></label><label className="rounded-xl border border-dashed border-surface-300 p-3 text-sm"><span className="flex items-center gap-2 font-semibold"><FiUpload /> PDF (opcional)</span><input type="file" accept=".pdf,application/pdf" onChange={e => setForm({ ...form, pdf: e.target.files?.[0] || null })} className="mt-2 block w-full text-xs" /></label></div>
          <div><label className="mb-1 block text-sm font-medium">Notas</label><textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="input-field" rows={2} maxLength={5000} /></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={cerrarRegistro} className="btn-secondary">Cancelar</button><button disabled={guardando} className="btn-primary">{guardando ? 'Guardando...' : 'Guardar timbrado'}</button></div>
        </form>}
      </Modal>

      <Modal isOpen={Boolean(facturaCancelar)} onClose={() => { setFacturaCancelar(null); setMotivo(''); }} title="Registrar cancelación de factura">
        {facturaCancelar && <form onSubmit={cancelarFactura} className="space-y-4"><p className="text-sm text-surface-600">La factura permanecerá en el historial y el pago volverá a la lista de pendientes para permitir un nuevo timbrado.</p><div><label className="mb-1 block text-sm font-medium">Motivo de cancelación *</label><textarea value={motivo} onChange={e => setMotivo(e.target.value)} className="input-field" rows={4} minLength={5} maxLength={1000} required /></div><div className="flex justify-end gap-2"><button type="button" onClick={() => setFacturaCancelar(null)} className="btn-secondary">Cerrar</button><button className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white">Confirmar cancelación</button></div></form>}
      </Modal>
    </div>
  );
}

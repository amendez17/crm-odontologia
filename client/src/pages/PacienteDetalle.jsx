import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Odontograma from '../components/Odontograma';
import Periodontograma from '../components/Periodontograma';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiPrinter, FiCalendar, FiMapPin, FiPhone, FiAlertTriangle, FiAward,FiEdit2, FiTrash2, FiFileText, FiUser, FiClock, FiUploadCloud, FiImage, FiExternalLink } from 'react-icons/fi';
import { fechaHoy } from '../utils/fecha';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';

const notaClinicaVacia = () => ({
  tipo_nota: 'subsecuente', antecedentes_heredofamiliares: '', antecedentes_patologicos: '', antecedentes_no_patologicos: '',
  antecedentes_odontologicos: '', habitos_orales: '', interrogatorio_sistemas: '',
  motivo_consulta: '', interrogatorio: '', exploracion_extraoral: '', exploracion_intraoral: '',
  presion_arterial: '', frecuencia_cardiaca: '', frecuencia_respiratoria: '', temperatura: '', peso: '', talla: '',
  diagnostico: '', pronostico: '', tratamiento_realizado: '', piezas_tratadas: '', receta: '', indicaciones: '', notas: ''
});

const cuestionarioVacio = () => ({
  heredofamiliares: [], patologicos: [], no_patologicos: [], odontologicos: [], habitos: [], sistemas: [],
  detalle_heredofamiliares: '', detalle_patologicos: '', detalle_no_patologicos: '',
  detalle_odontologicos: '', detalle_habitos: '', detalle_sistemas: ''
});

const opcionesAntecedentes = {
  heredofamiliares: ['Diabetes', 'Hipertensión', 'Cardiopatías', 'Cáncer', 'Enfermedad renal'],
  patologicos: ['Diabetes', 'Hipertensión', 'Cardiopatía', 'Anticoagulantes', 'Alergias', 'Cirugías', 'Hospitalizaciones', 'Embarazo'],
  no_patologicos: ['Tabaquismo', 'Alcohol', 'Drogas', 'Dieta alta en azúcar'],
  odontologicos: ['Tratamiento previo', 'Mala experiencia dental', 'Anestesia adversa', 'Sangrado prolongado'],
  habitos: ['Bruxismo', 'Respiración bucal', 'Onicofagia', 'Morder objetos', 'Higiene deficiente'],
  sistemas: ['Cardiovascular', 'Respiratorio', 'Digestivo', 'Neurológico', 'Endocrino', 'Hematológico']
};

export default function PacienteDetalle() {
  const { usuario } = useAuth();
  const puedeModificarClinico = ['administrador', 'doctor'].includes(usuario?.rol);
  const { id } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [odontograma, setOdontograma] = useState([]);
  const [historias, setHistorias] = useState([]);
  const [balance, setBalance] = useState(null);
  const [tab, setTab] = useState('info');
  const [modalHistoria, setModalHistoria] = useState(false);
  const [pasoHistoria, setPasoHistoria] = useState(1);
  const [modalAdenda, setModalAdenda] = useState(false);
  const [historiaOrigen, setHistoriaOrigen] = useState(null);
  const [modalPago, setModalPago] = useState(false);
  const [modalCita, setModalCita] = useState(false);
  const [doctores, setDoctores] = useState([]);
  const [formHistoria, setFormHistoria] = useState(notaClinicaVacia);
  const [cuestionario, setCuestionario] = useState(cuestionarioVacio);
  const [formAdenda, setFormAdenda] = useState({ motivo_adenda: '', diagnostico: '', tratamiento_realizado: '', piezas_tratadas: '', receta: '', notas: '' });
  const [archivosHistoria, setArchivosHistoria] = useState([]);
  const [subiendoArchivos, setSubiendoArchivos] = useState(null);
  const [formPago, setFormPago] = useState({ monto: '', metodo_pago: 'efectivo',fecha: fechaHoy(), presupuesto_id: '', numero_recibo: '',  notas: ''});
  const [formCita, setFormCita] = useState({ doctor_id: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '', hora_fin: '', motivo: '' });
  const [consentimientos, setConsentimientos] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [modalConsentimiento, setModalConsentimiento] = useState(false);
  const [formConsent, setFormConsent] = useState({ doctor_id: '', tipo: '', contenido: '' });
  const [modalFirmaConsentimiento, setModalFirmaConsentimiento] = useState(false);
  const [consentimientoFirma, setConsentimientoFirma] = useState(null);
  const [formFirma, setFormFirma] = useState({ firmante_nombre: '', firmante_caracter: 'paciente', aceptacion_explicita: false });
  const [loading, setLoading] = useState(true);
  const [formReceta, setFormReceta] = useState({diagnostico: '',medicamentos: '', indicaciones: '' });
  const [modalReceta, setModalReceta] = useState(false);
  const [recetas, setRecetas] = useState([]);
  const [loadingRecetas, setLoadingRecetas] = useState(true);
  const [editandoReceta, setEditandoReceta] = useState(null);
  const [modalEditarReceta, setModalEditarReceta] = useState(false);

useEffect(() => {

  socket.on('pago-creado', (nuevoPago) => {
    setPaciente(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        pagos: [nuevoPago, ...(prev.pagos || [])]
      };
    });

    cargarBalance();
    socket.on('reconnect', () => {
  cargar();
});
  });

  socket.on('pago-eliminado', (id) => {
    setPaciente(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        pagos: (prev.pagos || []).filter(p => p.id !== id)
      };
    });

    cargarBalance();
  });

  return () => {
    socket.off('pago-creado');
    socket.off('pago-eliminado');
  };

}, []);

  const cargarBalance = async () => {
  try {
    const { data } = await api.get(`/reportes/balance/${id}`);
    setBalance(data);
  } catch {}
};
  useEffect(() => {
  cargar();
  cargarRecetas();
  cargarBalance();
}, [id]);
  const cargar = async () => {
    try {const [pacRes, odonRes, histRes, balRes, consRes] = await Promise.all([
      api.get(`/pacientes/${id}`),
      puedeModificarClinico ? api.get(`/odontograma/${id}`) : Promise.resolve({ data: [] }),
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
    }};
 const cargarRecetas = async () => {
  if (!puedeModificarClinico) { setRecetas([]); setLoadingRecetas(false); return; }
  try {setLoadingRecetas(true);
  const { data } = await api.get(`/pacientes/${id}/recetas`);
    setRecetas(data || []);
  } catch (error) {
    console.error('ERROR RECETAS:', error);
    toast.error('Error al cargar recetas');
  } finally {
    setLoadingRecetas(false);}};
  useEffect(() => {cargar();cargarRecetas();}, [id]);
  useEffect(() => {
    api.get('/usuarios/doctores').then(res => setDoctores(res.data)).catch(() => {});
    api.get('/consentimiento/plantillas').then(res => setPlantillas(res.data)).catch(() => {});}, []);
  useEffect(() => {console.log("ODONTOGRAMA BACKEND:", odontograma);}, [odontograma]);
   const handleOdontograma = async (pieza, data) => {
    try {
      // Normaliza: acepta tanto string ('caries') como objeto ({ estado, cara })
      const payload = typeof data === 'string'? { estado: data, cara: 'completa' }: { cara: 'completa', ...data };
     // Busca el registro más reciente (mayor id) para esa pieza + cara
      const registro = odontograma.filter(r => r.pieza_dental === pieza && (r.cara || 'completa') === payload.cara).sort((a, b) => b.id - a.id)[0];
      if (!registro) {
        await api.post('/odontograma', { paciente_id: parseInt(id), pieza_dental: pieza, ...payload});
      } else {
        await api.put(`/odontograma/${registro.id}`, payload);
      }

      const { data: refreshed } = await api.get(`/odontograma/${id}`);
      setOdontograma(refreshed);
      toast.success('Odontograma actualizado');
    } catch (error) {
      console.error('Error guardando odontograma:', error.response?.data || error);
      toast.error('Error al guardar odontograma');
    }};
 
  const validarArchivos = (files) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (files.some(file => !permitidos.includes(file.type))) {
      toast.error('Solo se permiten imágenes JPG, PNG, WEBP y archivos PDF');
      return false;
    }
    if (files.some(file => file.size > 10 * 1024 * 1024)) {
      toast.error('Cada archivo debe pesar máximo 10 MB');
      return false;
    }
    if (files.length > 10) {
      toast.error('Puedes subir máximo 10 archivos a la vez');
      return false;
    }
    return true;
  };

  const subirAdjuntos = async (historiaId, files, mostrarMensaje = true) => {
    const seleccionados = Array.from(files || []);
    if (!seleccionados.length || !validarArchivos(seleccionados)) return false;
    const data = new FormData();
    seleccionados.forEach(file => data.append('archivos', file));
    setSubiendoArchivos(historiaId);
    try {
      await api.post(`/historia/${historiaId}/archivos`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { data: historiasActualizadas } = await api.get(`/historia/${id}`);
      setHistorias(historiasActualizadas);
      if (mostrarMensaje) toast.success('Archivos agregados correctamente');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al subir los archivos');
      return false;
    } finally {
      setSubiendoArchivos(null);
    }
  };

  const guardarHistoria = async (e) => {
    e.preventDefault();
    try {
      const respuesta = (grupo, detalle) => {
        const seleccion = cuestionario[grupo];
        const texto = seleccion.length ? seleccion.join(', ') : 'Ninguno referido';
        return cuestionario[detalle]?.trim() ? `${texto}. Detalles: ${cuestionario[detalle].trim()}` : texto;
      };
      const antecedentes = formHistoria.tipo_nota === 'inicial' ? {
        antecedentes_heredofamiliares: respuesta('heredofamiliares', 'detalle_heredofamiliares'),
        antecedentes_patologicos: respuesta('patologicos', 'detalle_patologicos'),
        antecedentes_no_patologicos: respuesta('no_patologicos', 'detalle_no_patologicos'),
        antecedentes_odontologicos: respuesta('odontologicos', 'detalle_odontologicos'),
        habitos_orales: respuesta('habitos', 'detalle_habitos'),
        interrogatorio_sistemas: respuesta('sistemas', 'detalle_sistemas')
      } : {};
      const { data: nuevaHistoria } = await api.post('/historia', { ...formHistoria, ...antecedentes, paciente_id: parseInt(id), fecha: new Date().toISOString().split('T')[0] });
      if (archivosHistoria.length) await subirAdjuntos(nuevaHistoria.id, archivosHistoria, false);
      toast.success(archivosHistoria.length ? 'Registro y archivos añadidos' : 'Registro añadido');
      setModalHistoria(false);
      setPasoHistoria(1);
      setFormHistoria(notaClinicaVacia());
      setCuestionario(cuestionarioVacio());
      setArchivosHistoria([]);
      const { data } = await api.get(`/historia/${id}`);
      setHistorias(data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }};

  const avanzarHistoria = () => {
    if (pasoHistoria === 1 && !formHistoria.motivo_consulta.trim()) return toast.error('Captura el motivo de consulta');
    if (pasoHistoria === 1 && formHistoria.tipo_nota === 'inicial' && !formHistoria.interrogatorio.trim()) return toast.error('Captura el padecimiento actual');
    if (pasoHistoria === 2 && formHistoria.tipo_nota === 'inicial' && !formHistoria.exploracion_intraoral.trim()) return toast.error('Captura la exploración intraoral');
    setPasoHistoria(paso => paso + 1);
  };

  const alternarAntecedente = (grupo, opcion) => {
    setCuestionario(actual => ({
      ...actual,
      [grupo]: actual[grupo].includes(opcion) ? actual[grupo].filter(item => item !== opcion) : [...actual[grupo], opcion]
    }));
  };

  const guardarAdenda = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/historia/${historiaOrigen.id}/adendas`, formAdenda);
      const { data } = await api.get(`/historia/${id}`);
      setHistorias(data);
      setModalAdenda(false);
      setHistoriaOrigen(null);
      setFormAdenda({ motivo_adenda: '', diagnostico: '', tratamiento_realizado: '', piezas_tratadas: '', receta: '', notas: '' });
      toast.success('Adenda registrada sin modificar la nota original');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar la adenda');
    }
  };

  const crearConsentimiento = async (e) => {e.preventDefault();
    try {
      await api.post('/consentimiento', { paciente_id: parseInt(id), doctor_id: formConsent.doctor_id, tipo: formConsent.tipo, contenido: formConsent.contenido });
      toast.success('Consentimiento creado');
      setModalConsentimiento(false);
      const { data } = await api.get(`/consentimiento/paciente/${id}`);
      setConsentimientos(data);
    } catch { toast.error('Error al crear consentimiento'); }};
  const firmarConsentimiento = async (e) => { e.preventDefault();
    try { await api.put(`/consentimiento/${consentimientoFirma.id}/firmar`, formFirma);
      toast.success('Consentimiento firmado');
      setModalFirmaConsentimiento(false);
      setConsentimientoFirma(null);
      const { data } = await api.get(`/consentimiento/paciente/${id}`);
      setConsentimientos(data);
    } catch (error) { toast.error(error.response?.data?.error || 'Error al firmar'); }};

  const imprimirConsentimiento = (c) => {
  const win = window.open('', '_blank', 'width=700,height=900');
  const pacienteData = paciente || c.paciente || {};
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Consentimiento - ${c.tipo}</title>
<style>

/* FORMATO CARTA */
@page { size: Letter; margin: 10mm 12mm 12mm 12mm;}

body{ font-family: 'Segoe UI', Arial, sans-serif; margin:0; padding:5px 10px 10px 10px; max-width:650px; margin:auto; color:#2c2c2c; background:#ffffff;}

/* CONTENEDOR */
.container{ border:1px solid #f0e6c8; border-radius:12px; padding:20px; position:relative;}

/* MARCA DE AGUA */
.watermark{ position:absolute; top:40%; left:50%; transform:translate(-50%, -50%); font-size:70px; color:rgba(200,162,74,0.08); font-weight:bold; pointer-events:none;}

/* HEADER PREMIUM */
.header{ text-align:center; border-bottom:2px solid #c8a24a; padding-bottom:8px; margin-bottom:12px;}

.logo{ width:70px; margin-bottom:5px;}

.header h1{ margin:0; color:#b8962e; font-size:18px; letter-spacing:1px;}

.header h2{ margin:2px 0; font-size:13px; color:#6b7280;}

.tipo{ font-size:11px; color:#a68b2c; margin-top:3px;}

/* INFO CARDS */
.info{ font-size:12px; margin:10px 0; padding:10px; background:#fffaf0; border-left:4px solid #c8a24a; border-radius:6px;}

/* CONTENIDO */
.content{ white-space:pre-wrap; font-size:12px; margin:12px 0; line-height:1.6;}

/* ESTADO */
.estado{ font-size:12px; margin:8px 0; padding:8px; background:#fef9e7; border-left:4px solid #c8a24a; border-radius:5px; color:#7a5c1b; font-weight:bold;}

/* FIRMAS */
.firma-section{ margin-top:35px; display:flex; justify-content:space-between;}

.linea{ border-top:1px solid #c8a24a; margin-top:50px; width:200px; text-align:center; font-size:11px; color:#6b7280;}

/* FOOTER */
.footer{ margin-top:20px; text-align:center; font-size:10px; color:#9ca3af;}
</style>
</head>
<body>
<div class="container">
  <div class="watermark">ALMAR</div>
  <div class="header">
    <img  src="/logo_clinica-removebg-preview.png" class="logo" alt="Clinica Dental Almar"/>
    <h1>Clínica Dental Almar</h1>
     <h2> 🏢Av Óscar Pérez Escobosa Local 36, Fraccionamiento Hacienda del Seminario, 82129 Mazatlán, Sin.</h2>
    <h2>📞 669 113 0990</h2>
    <h2>Consentimiento Informado</h2>
    <div class="tipo">${c.tipo || ''}</div>
  </div>
  <div class="info">
    <strong>Paciente:</strong> ${pacienteData.nombre || '---'} ${pacienteData.apellido || ''}<br>
    <strong>Numero de paciente:</strong> ${pacienteData.dni || '---'}<br>
    <strong>Doctor:</strong> Dr. ${c.doctor?.nombre || ''} ${c.doctor?.apellido || ''}<br>
    <strong>Fecha:</strong> ${c.createdAt?.split('T')[0] || ''}
  </div>

  <div class="content">${c.contenido || 'Sin contenido'} </div>

  ${c.firmado  ? `<div class="estado">
          ✔ ACEPTADO Y FIRMADO el ${new Date(c.fecha_firma).toLocaleString('es-MX')}<br>
          Firmante: ${c.firmante_nombre || 'No registrado'} · Carácter: ${(c.firmante_caracter || '').replace('_', ' ')}
        </div>` : '' }

  ${c.firma_hash ? `<div style="font-size:8px;color:#6b7280;overflow-wrap:anywhere"><strong>Sello de integridad:</strong> ${c.firma_hash}</div>` : ''}

  <div class="firma-section">
    <div>
      <div class="linea">Firma del profesional</div>
    </div>

    <div>
      <div class="linea">Firma del paciente</div>
    </div>
  </div>

  <div class="footer">
    Clínica Dental Almar · Documento confidencial
  </div>
</div>
</body>
</html>`);

  win.document.close();
win.onload = () => {
  win.focus();
  win.print();
};
  };
 const imprimirHistoria = () => {
  const win = window.open('', '_blank', 'width=700,height=900');
  const registros = historias.map(h => {
    const imagenes = (h.archivos || []).filter(archivo => archivo.tipo === 'imagen');
    const pdfs = (h.archivos || []).filter(archivo => archivo.tipo === 'pdf');
    return `
    <div class="registro">
      <div class="registro-header">
        ${h.fecha_hora ? new Date(h.fecha_hora).toLocaleString('es-MX') : h.fecha} - Dr. ${h.doctor_nombre || `${h.doctor?.nombre || ''} ${h.doctor?.apellido || ''}`}
        ${h.doctor_cedula || h.doctor?.cedula ? ` · Cédula: ${h.doctor_cedula || h.doctor.cedula}` : ''}
        ${h.es_adenda ? ' · ADENDA' : ''}
        ${h.tipo_nota === 'inicial' ? ' · PRIMERA CONSULTA' : h.tipo_nota === 'subsecuente' ? ' · SUBSECUENTE' : ''}
      </div>

      ${h.diagnostico ? `<p><strong>Diagnóstico:</strong> ${h.diagnostico}</p>` : ''}
      ${h.motivo_consulta ? `<p><strong>Motivo de consulta:</strong> ${h.motivo_consulta}</p>` : ''}
      ${h.interrogatorio ? `<p><strong>Interrogatorio:</strong> ${h.interrogatorio}</p>` : ''}
      ${h.antecedentes_heredofamiliares ? `<p><strong>Antecedentes heredofamiliares:</strong> ${h.antecedentes_heredofamiliares}</p>` : ''}
      ${h.antecedentes_patologicos ? `<p><strong>Antecedentes patológicos:</strong> ${h.antecedentes_patologicos}</p>` : ''}
      ${h.antecedentes_no_patologicos ? `<p><strong>Antecedentes no patológicos:</strong> ${h.antecedentes_no_patologicos}</p>` : ''}
      ${h.antecedentes_odontologicos ? `<p><strong>Antecedentes odontológicos:</strong> ${h.antecedentes_odontologicos}</p>` : ''}
      ${h.habitos_orales ? `<p><strong>Hábitos orales:</strong> ${h.habitos_orales}</p>` : ''}
      ${h.interrogatorio_sistemas ? `<p><strong>Interrogatorio por sistemas:</strong> ${h.interrogatorio_sistemas}</p>` : ''}
      ${h.exploracion_extraoral ? `<p><strong>Exploración extraoral:</strong> ${h.exploracion_extraoral}</p>` : ''}
      ${h.exploracion_intraoral ? `<p><strong>Exploración intraoral:</strong> ${h.exploracion_intraoral}</p>` : ''}
      ${(h.presion_arterial || h.frecuencia_cardiaca || h.frecuencia_respiratoria || h.temperatura || h.peso || h.talla) ? `<p><strong>Signos vitales:</strong> ${[
        h.presion_arterial && `TA ${h.presion_arterial} mmHg`, h.frecuencia_cardiaca && `FC ${h.frecuencia_cardiaca} lpm`,
        h.frecuencia_respiratoria && `FR ${h.frecuencia_respiratoria} rpm`, h.temperatura && `Temp. ${h.temperatura} °C`,
        h.peso && `Peso ${h.peso} kg`, h.talla && `Talla ${h.talla} cm`
      ].filter(Boolean).join(' · ')}</p>` : ''}
      ${h.pronostico ? `<p><strong>Pronóstico:</strong> ${h.pronostico}</p>` : ''}
      ${h.tratamiento_realizado ? `<p><strong>Tratamiento:</strong> ${h.tratamiento_realizado}</p>` : ''}
      ${h.piezas_tratadas ? `<p><strong>Piezas:</strong> ${h.piezas_tratadas}</p>` : ''}
      ${h.receta ? `<p><strong>Plan de tratamiento:</strong> ${h.receta}</p>` : ''}
      ${h.indicaciones ? `<p><strong>Indicaciones:</strong> ${h.indicaciones}</p>` : ''}
      ${h.notas ? `<p class="notas">${h.notas}</p>` : ''}
      ${h.es_adenda ? `<p><strong>Motivo de la adenda:</strong> ${h.motivo_adenda || ''}</p>` : ''}
      ${h.firma_hash ? `<p class="sello-integridad"><strong>Sello de integridad:</strong> ${h.firma_hash}</p>` : ''}

      ${imagenes.length ? `
        <div class="anexos-titulo">Fotografías clínicas</div>
        <div class="galeria-impresion">
          ${imagenes.map(archivo => `
            <figure>
              <img src="${archivo.url}" alt="${archivo.nombre_original || 'Fotografía clínica'}" />
              <figcaption>${archivo.nombre_original || 'Fotografía clínica'}</figcaption>
            </figure>
          `).join('')}
        </div>
      ` : ''}

      ${pdfs.length ? `
        <div class="pdfs-impresion">
          <strong>Estudios PDF anexos:</strong> ${pdfs.map(archivo => archivo.nombre_original).join(', ')}
        </div>
      ` : ''}
    </div>
  `}).join('');
  win.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Historia Clínica - ${paciente.nombre}, ${paciente.apellido}</title>
<style>
/* 📄 FORMATO CARTA */
@page {size: Letter; margin: 10mm 12mm 12mm 12mm;}

body{font-family: 'Segoe UI', Arial, sans-serif; padding:10px; max-width:700px; margin:auto; color:#2c2c2c; background:#fff;}

/* HEADER PREMIUM */
.header{ text-align:center; border-bottom:2px solid #c8a24a; padding-bottom:10px; margin-bottom:15px;}

.logo{width:70px; margin-bottom:5px;}

.header h1{ margin:0; color:#c8a24a; font-size:20px;}

.header h2{ margin:3px 0; font-size:14px; color:#6b7280;}

/* INFO PACIENTE */
.paciente-info{ display:flex; justify-content:space-between; background:#fffaf0; padding:10px 12px; border-radius:8px; margin-bottom:15px; font-size:12px; border-left:4px solid #c8a24a;}
/* ALERTAS */
.alerta{ font-size:12px;  margin-bottom:10px;}

.alerta.alergia{ color:#b91c1c;}
.alerta.normal{ color:#333;}

/* REGISTROS */
.registro{ border:1px solid #f0e6c8; border-radius:10px; padding:14px; margin-bottom:10px; background:#fff;}

.registro-header{ font-weight:bold; color:#c8a24a; margin-bottom:6px; font-size:12px; border-bottom:1px solid #f5e6b3;  padding-bottom:4px;}

.registro p{ margin:3px 0; font-size:12px;}

.notas{ color:#6b7280; font-style:italic;}

.anexos-titulo{ margin-top:10px; padding-top:8px; border-top:1px solid #f5e6b3; font-size:11px; font-weight:bold; color:#7a5c1b;}

.galeria-impresion{ display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; margin-top:7px;}

.galeria-impresion figure{ margin:0; border:1px solid #eee; border-radius:6px; padding:4px; page-break-inside:avoid;}

.galeria-impresion img{ display:block; width:100%; height:190px; object-fit:contain; background:#fafafa; border-radius:4px;}

.galeria-impresion figcaption{ margin-top:3px; font-size:8px; color:#6b7280; text-align:center; overflow-wrap:anywhere;}

.pdfs-impresion{ margin-top:8px; padding:7px; background:#f8fafc; border-radius:5px; font-size:10px; color:#475569; page-break-inside:avoid;}

.sello-integridad{ margin-top:8px !important; font-family:monospace; font-size:7px !important; color:#64748b; overflow-wrap:anywhere;}

/* FOOTER */
.footer{ text-align:center; margin-top:20px; font-size:10px; color:#9ca3af; border-top:1px solid #eee; padding-top:8px;}
</style>
</head>
<body>

<div class="header">
 <img  src="/logo_clinica-removebg-preview.png" class="logo" alt="Clinica Dental Almar" />
  <h1>Clínica Dental Almar</h1>
   <h2> 🏢 Av Óscar Pérez Escobosa Local 36, Fraccionamiento Hacienda del Seminario, 82129 Mazatlán, Sin.</h2>
    <h2>📞 669 113 0990</h2>
  <h2>Historia Clínica</h2>
</div>

<div class="paciente-info">
  <div><strong>Paciente:</strong> ${paciente.nombre}, ${paciente.apellido}</div>
  <div><strong>Numero de paciente:</strong> ${paciente.dni}</div>
  <div><strong>Edad:</strong> ${edad !== null ? edad + ' años' : '-'}</div>
</div>

${paciente.alergias ? `
  <div class="alerta alergia">
    <strong>⚠️ Alergias:</strong> ${paciente.alergias}
  </div>` : ''}${paciente.antecedentes_medicos ? `
  <div class="alerta normal">
    <strong>Antecedentes:</strong> ${paciente.antecedentes_medicos}
  </div>` : ''}${registros || '<p style="text-align:center;color:#999">Sin registros</p>'}
<div class="footer">
  Total: ${historias.length} registros |
  Impreso: ${new Date().toLocaleDateString('es-MX')}
</div>

</body>
</html>
  `);

  win.document.close();

 win.onload = () => {
  win.focus();
  win.print();
};
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
      setFormPago({ monto: '', metodo_pago: 'efectivo', fecha: fechaHoy(), presupuesto_id: '', numero_recibo: '', notas: ''});
    } catch (err) {
     toast.error(
    err.response?.data?.error ||
    'Error al registrar pago'
  );

}
  };

 const imprimirRecibo = (pago) => {
  const recibo = window.open('', '_blank', 'width=420,height=650');

  recibo.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Recibo de Pago</title>

<style>
@page { size: A5; margin: 10mm;}

body{font-family: Arial, sans-serif; margin:0; padding:0; background:#fff;color:#2c2c2c;}

/* CONTENEDOR */
.container{ padding:20px; border:1px solid #f0e6c8; border-radius:12px;}

/* HEADER */
.header{ text-align:center; border-bottom:2px solid #c8a24a; padding-bottom:10px; margin-bottom:15px;}

.logo{ width:70px; margin-bottom:8px;}

.header h1{ margin:0; font-size:18px; color:#b8962e;}

.header p{ margin:2px 0; font-size:12px; color:#6b7280;}

/* MONTO */
.total{ text-align:center; margin:15px 0; padding:15px; background:#fffaf0; border-left:4px solid #c8a24a; border-radius:8px;}

.total .label{ font-size:11px; color:#6b7280;}

.total .amount{ font-size:28px; font-weight:bold; color:#b8962e; margin-top:5px;}

/* INFO */
.info{ margin-top:15px;}

.info-row{ display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dotted #e5e7eb; font-size:13px;}

.label{ color:#6b7280;}

.value{ font-weight:bold; color:#2c2c2c; }

/* FOOTER */
.footer{margin-top:20px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #eee;padding-top:10px;}
</style>

</head>

<body>

<div class="container">

  <div class="header">
    <img class="logo" src="/logo_clinica-removebg-preview.png" />
    <h1>Clínica Dental Almar</h1>
    <p>Recibo de Pago</p>
  </div>

  <div class="total">
    <div class="label">MONTO RECIBIDO</div>
    <div class="amount">$${Number(pago.monto).toLocaleString()}</div>
  </div>

  <div class="info">
    <div class="info-row">
      <span class="label">Paciente</span>
      <span class="value">${paciente.nombre} ${paciente.apellido}</span>
    </div>

    <div class="info-row">
      <span class="label">Numero de paciente</span>
      <span class="value">${paciente.dni}</span>
    </div>

    <div class="info-row">
      <span class="label">Fecha</span>
      <span class="value">${pago.fecha}</span>
    </div>

    <div class="info-row">
      <span class="label">Método</span>
      <span class="value">${pago.metodo_pago?.replace('_', ' ')}</span>
    </div>

    ${pago.numero_recibo ? `
    <div class="info-row">
      <span class="label">Recibo #</span>
      <span class="value">${pago.numero_recibo}</span>
    </div>` : ''}

    ${pago.notas ? `
    <div class="info-row">
      <span class="label">Notas</span>
      <span class="value">${pago.notas}</span>
    </div>` : ''}
  </div>

  <div class="footer">
    🔰Gracias por su confianza · Clínica Dental Almar<br/>
    ${new Date().toLocaleDateString('es-MX')}
  </div>

</div>

<script>
window.onload = () => window.print();
</script>
</body>
</html>`);
  recibo.document.close();};

  if (loading) return <div className="text-center py-10 text-surface-400">Cargando...</div>;
  if (!paciente) return <div className="text-center py-10 text-surface-400">Paciente no encontrado</div>;

 const tabs = [
  { key: 'info', label: 'Información' },
  ...(puedeModificarClinico ? [
    { key: 'odontograma', label: 'Odontograma' },
    { key: 'periodontograma', label: 'Periodontograma' },
    { key: 'recetas', label: 'Recetas' }
  ] : []),
  { key: 'historia', label: 'Historia Clínica' },
  { key: 'consentimientos', label: 'Consentimientos' },
  { key: 'balance', label: 'Cuenta Corriente' },
  { key: 'citas', label: 'Citas' },
  { key: 'pagos', label: 'Pagos' }
];
  const edad = paciente.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(paciente.fecha_nacimiento)) / 31557600000)
    : null;
   
  //Crea Receta
 const guardarReceta = async (e) => {
  e.preventDefault();

  try { await api.post(`/pacientes/${id}/recetas`, formReceta);

    toast.success('Receta creada');

    setFormReceta({
      diagnostico: '',
      medicamentos: '',
      indicaciones: ''
    });

    cargarRecetas(); // ← recarga automáticamente

  } catch (error) {

    console.error(error);

    toast.error('Error al guardar receta');
  }
};
//Imprimir Reseta
  const imprimirReceta = (r) => {

  const ventana = window.open('', '_blank', 'width=900,height=1000');

  ventana.document.write(`
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8">
<title>Receta Premium #${r.id}</title>

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
  top:35%;
  left:50%;
  transform:translate(-50%,-50%);
  opacity:0.05;
  font-size:100px;
  font-weight:bold;
  color:#c8a24a;
  z-index:0;
  pointer-events:none;
}

.container{
  position:relative;
  z-index:1;
  max-width:850px;
  margin:10px auto;
  background:#fff;
  padding:26px;
  border-radius:14px;
  box-shadow:0 15px 40px rgba(0,0,0,0.08);
}

/* HEADER */
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
  margin-bottom:25px;
}

.card{
  background:#fffaf0;
  border-left:4px solid #c8a24a;
  padding:14px;
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

/* SECTIONS */
.section{
  margin-top:18px;
  border:1px solid #f1f5f9;
  border-radius:12px;
  overflow:hidden;
}

.section-header{
  background:linear-gradient(90deg,#c8a24a,#e2c275);
  color:white;
  padding:12px 16px;
  font-size:13px;
  font-weight:bold;
  text-transform:uppercase;
  letter-spacing:1px;
}

.section-content{
  padding:18px;
  font-size:14px;
  line-height:1.8;
  color:#374151;
  white-space:pre-wrap;
  min-height:70px;
}

/* SIGNATURE */
.firma{
  margin-top:70px;
  display:flex;
  justify-content:space-around;
}

.linea{
  border-top:1px solid #c8a24a;
  width:220px;
  text-align:center;
  padding-top:6px;
  font-size:12px;
  color:#6b7280;
}

/* FOOTER */
.footer{
  margin-top:40px;
  text-align:center;
  font-size:11px;
  color:#9ca3af;
}

/* PRINT */
@media print {
  @page {
    size: letter;
    margin: 8mm;
  }

  body {
    background: white;
  }

  .container {
    margin: 0 auto;
    padding: 22px;
    box-shadow: none;
    border-radius: 0;
  }

  .header {
    padding-bottom: 12px;
    margin-bottom: 14px;
  }

  .logo {
    width: 70px;
    height: 70px;
    margin-bottom: 5px;
  }

  .info {
    margin-bottom: 14px;
  }

  .card {
    padding: 10px;
  }

  .section {
    margin-top: 10px;
  }

  .section-header {
    padding: 8px 12px;
  }

  .section-content {
    padding: 12px;
    min-height: 45px;
    line-height: 1.45;
    font-size: 13px;
  }

  .firma {
    margin-top: 38px;
  }

  .footer {
    margin-top: 22px;
  }
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

    <p>Receta Médica Profesional</p>

    <p>
      🏢 Av Óscar Pérez Escobosa Local 36,
      Fraccionamiento Hacienda del Seminario,
      82129 Mazatlán, Sin.
    </p>

    <p>📞 669 113 0990</p>

  </div>

  <!-- INFO -->
  <div class="info">

    <div class="card">
      <div class="label">Paciente</div>

      <div class="value">
        ${paciente.nombre} ${paciente.apellido}
      </div>

      <div style="font-size:12px;color:#6b7280">
        Número de Paciente:
        ${paciente.dni || ''}
      </div>
    </div>

    <div class="card">

  <div class="label">Doctor</div>

  <div class="value">
    Dr. ${r.doctor?.nombre || ''} ${r.doctor?.apellido || ''}
  </div>

  <div style="font-size:12px; color:#6b7280; margin-top:6px; line-height:1.5; ">
    ${r.doctor?.especialidad || 'Cirujano Dentista'}
    <br/>
    Céd. Prof. ${r.doctor?.cedula || '0000000'}
  </div>

</div>
    <div class="card">
      <div class="label">Fecha</div>

      <div class="value">
        ${r.createdAt?.split('T')[0]}
      </div>

      <div style="font-size:12px;color:#6b7280">
        Folio: RX-${new Date(r.createdAt).getFullYear()}-${String(r.id).padStart(5, '0')}
      </div>
    </div>

  </div>

  <!-- DIAGNOSTICO -->
  <div class="section">

    <div class="section-header">
      Diagnóstico
    </div>

    <div class="section-content">
      ${r.diagnostico || 'Sin diagnóstico'}
    </div>

  </div>

  <!-- MEDICAMENTOS -->
  <div class="section">

    <div class="section-header">
      Medicamentos
    </div>

    <div class="section-content">
     ${r.medicamentos || 'Sin medicamentos'}
    </div>

  </div>

  <!-- INDICACIONES -->
  <div class="section">

    <div class="section-header">
      Indicaciones
    </div>

    <div class="section-content">
      ${r.indicaciones || 'Sin indicaciones'}
    </div>

  </div>

  <!-- FIRMAS -->
  <div class="firma">

    <div class="linea">
      Firma del Profesional
    </div>


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

  ventana.document.close();
};
 //Eliminar Receta
  const eliminarReceta = async (idReceta) => {
  if (!window.confirm('¿Eliminar esta receta?')) return;

  try {
    await api.delete(`/pacientes/recetas/${idReceta}`);

    toast.success('Receta eliminada');

    cargarRecetas();

  } catch (error) {
    console.error(error);
    toast.error('No tienes permiso para eliminar receta');
  }
};
  //Editar Receta
  const abrirEditarReceta = (receta) => {
  setEditandoReceta(receta);

  setFormReceta({
    diagnostico: receta.diagnostico || '',
    medicamentos: receta.medicamentos || '',
    indicaciones: receta.indicaciones || ''
  });

  setModalEditarReceta(true);
};
  //Actualizr receta
  const actualizarReceta = async (e) => {
  e.preventDefault();

  try {
    await api.put(
      `/pacientes/recetas/${editandoReceta.id}`,
      formReceta
    );

    toast.success('Receta actualizada');

    setModalEditarReceta(false);

    setEditandoReceta(null);

    setFormReceta({
      diagnostico: '',
      medicamentos: '',
      indicaciones: ''
    });

    cargarRecetas();

  } catch (error) {
    console.error(error);
    toast.error('No tienes permisos para actualizar esta receta');
  }
};
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/pacientes" className="p-2.5 hover:bg-white/80 rounded-xl border border-surface-200 transition-all hover:shadow-sm"><FiArrowLeft size={20} className="text-surface-600" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary-800">{paciente.nombre}, {paciente.apellido}</h1>
          <p className="text-surface-500">Número de paciente: {paciente.dni} {edad !== null && `| ${edad} años`}</p>
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
          {puedeModificarClinico && <div className="card">
            <h3 className="font-semibold text-primary-900 mb-4">Información Médica</h3>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-surface-500 mb-1">Antecedentes Médicos</dt><dd className="text-primary-900">{paciente.antecedentes_medicos || 'Sin antecedentes'}</dd></div>
              <div><dt className="text-surface-500 mb-1">Alergias</dt><dd className="text-red-600 font-medium">{paciente.alergias || 'Sin alergias conocidas'}</dd></div>
              <div><dt className="text-surface-500 mb-1">Medicamentos</dt><dd className="text-primary-900">{paciente.medicamentos || 'Ninguno'}</dd></div>
              <div><dt className="text-surface-500 mb-1">Notas</dt><dd className="text-primary-900">{paciente.notas || '-'}</dd></div>
            </dl>
          </div>}
        </div>
      )}

      {/* Tab Odontograma */}
      {tab === 'odontograma' && (
        <div className="card">
          <h3 className="font-semibold text-primary-900 mb-4">Odontograma Digital</h3>
          <Odontograma registros={odontograma} onPiezaClick={handleOdontograma} />
        </div>
      )}

      {tab === 'periodontograma' && (
        <div className="card"><Periodontograma pacienteId={id} /></div>
      )}

      {/* Tab Historia */}
      {tab === 'historia' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {puedeModificarClinico && <button onClick={() => { setFormHistoria({ ...notaClinicaVacia(), tipo_nota: historias.length === 0 ? 'inicial' : 'subsecuente' }); setCuestionario(cuestionarioVacio()); setPasoHistoria(1); setModalHistoria(true); }} className="btn-primary flex items-center gap-2">
              <FiPlus size={16} /> Nuevo Registro
            </button>}
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
                <div>
                  <p className="text-sm text-surface-500 font-medium">
                    {h.fecha_hora ? new Date(h.fecha_hora).toLocaleString('es-MX') : h.fecha} - Dr. {h.doctor_nombre || `${h.doctor?.nombre || ''} ${h.doctor?.apellido || ''}`}
                  </p>
                  {(h.doctor_cedula || h.doctor?.cedula) && <p className="text-xs text-surface-500">Cédula profesional: {h.doctor_cedula || h.doctor.cedula}</p>}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {h.tipo_nota === 'inicial' && <span className="badge bg-blue-100 text-blue-700">Primera consulta</span>}
                  {h.tipo_nota === 'subsecuente' && <span className="badge bg-surface-100 text-surface-700">Subsecuente</span>}
                  {h.es_adenda && <span className="badge bg-amber-100 text-amber-700">Adenda</span>}
                  {h.integridad_valida === true && <span className="badge bg-green-100 text-green-700">Integridad verificada</span>}
                  {h.integridad_valida === false && <span className="badge bg-red-100 text-red-700">Revisar integridad</span>}
                </div>
              </div>
              {h.diagnostico && <p className="text-sm"><span className="font-medium">Diagnóstico:</span> {h.diagnostico}</p>}
              {h.motivo_consulta && <p className="text-sm"><span className="font-medium">Motivo de consulta:</span> {h.motivo_consulta}</p>}
              {h.interrogatorio && <p className="text-sm"><span className="font-medium">Interrogatorio:</span> {h.interrogatorio}</p>}
              {h.antecedentes_heredofamiliares && <p className="text-sm"><span className="font-medium">Antecedentes heredofamiliares:</span> {h.antecedentes_heredofamiliares}</p>}
              {h.antecedentes_patologicos && <p className="text-sm"><span className="font-medium">Antecedentes patológicos:</span> {h.antecedentes_patologicos}</p>}
              {h.antecedentes_no_patologicos && <p className="text-sm"><span className="font-medium">Antecedentes no patológicos:</span> {h.antecedentes_no_patologicos}</p>}
              {h.antecedentes_odontologicos && <p className="text-sm"><span className="font-medium">Antecedentes odontológicos:</span> {h.antecedentes_odontologicos}</p>}
              {h.habitos_orales && <p className="text-sm"><span className="font-medium">Hábitos orales:</span> {h.habitos_orales}</p>}
              {h.interrogatorio_sistemas && <p className="text-sm"><span className="font-medium">Interrogatorio por sistemas:</span> {h.interrogatorio_sistemas}</p>}
              {h.exploracion_extraoral && <p className="text-sm"><span className="font-medium">Exploración extraoral:</span> {h.exploracion_extraoral}</p>}
              {h.exploracion_intraoral && <p className="text-sm"><span className="font-medium">Exploración intraoral:</span> {h.exploracion_intraoral}</p>}
              {(h.presion_arterial || h.frecuencia_cardiaca || h.frecuencia_respiratoria || h.temperatura || h.peso || h.talla) && <p className="text-sm"><span className="font-medium">Signos vitales:</span> {[
                h.presion_arterial && `TA ${h.presion_arterial}`, h.frecuencia_cardiaca && `FC ${h.frecuencia_cardiaca}`,
                h.frecuencia_respiratoria && `FR ${h.frecuencia_respiratoria}`, h.temperatura && `${h.temperatura} °C`, h.peso && `${h.peso} kg`, h.talla && `${h.talla} cm`
              ].filter(Boolean).join(' · ')}</p>}
              {h.pronostico && <p className="text-sm"><span className="font-medium">Pronóstico:</span> {h.pronostico}</p>}
              {h.tratamiento_realizado && <p className="text-sm"><span className="font-medium">Tratamiento:</span> {h.tratamiento_realizado}</p>}
              {h.piezas_tratadas && <p className="text-sm"><span className="font-medium">Piezas:</span> {h.piezas_tratadas}</p>}
              {h.receta && <p className="text-sm"><span className="font-medium">Plan de Tratamiento:</span> {h.receta}</p>}
              {h.indicaciones && <p className="text-sm"><span className="font-medium">Indicaciones:</span> {h.indicaciones}</p>}
              {h.notas && <p className="text-sm text-surface-500 mt-1 italic">{h.notas}</p>}
              {h.es_adenda && <p className="text-sm mt-2 text-amber-700"><span className="font-medium">Motivo de la adenda:</span> {h.motivo_adenda}</p>}
              {h.archivos?.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {h.archivos.map(archivo => (
                    <div key={archivo.id} className="relative border border-surface-200 rounded-lg overflow-hidden bg-white group">
                      {archivo.tipo === 'imagen' ? (
                        <a href={archivo.url} target="_blank" rel="noreferrer" title="Abrir imagen">
                          <img src={archivo.url} alt={archivo.nombre_original} className="w-full h-28 object-cover" loading="lazy" />
                        </a>
                      ) : (
                        <a href={archivo.url} target="_blank" rel="noreferrer" className="h-28 flex flex-col items-center justify-center text-red-600 bg-red-50">
                          <FiFileText size={32} />
                          <span className="text-xs font-medium mt-1">Ver PDF</span>
                        </a>
                      )}
                      <div className="p-2 flex items-center gap-1">
                        <span className="text-xs text-surface-600 truncate flex-1" title={archivo.nombre_original}>{archivo.nombre_original}</span>
                        <a href={archivo.url} target="_blank" rel="noreferrer" className="text-primary-600" title="Abrir archivo"><FiExternalLink size={14} /></a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {puedeModificarClinico && <label className={`mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600 cursor-pointer ${subiendoArchivos === h.id ? 'opacity-50 pointer-events-none' : ''}`}>
                <FiUploadCloud size={16} /> {subiendoArchivos === h.id ? 'Subiendo...' : 'Agregar imágenes o PDF'}
                <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e => { subirAdjuntos(h.id, e.target.files); e.target.value = ''; }} />
              </label>}
              {puedeModificarClinico && <button type="button" onClick={() => { setHistoriaOrigen(h); setFormAdenda({ motivo_adenda: '', diagnostico: '', tratamiento_realizado: '', piezas_tratadas: '', receta: '', notas: '' }); setModalAdenda(true); }} className="mt-3 ml-4 text-sm font-medium text-amber-700 hover:text-amber-800">
                Agregar adenda
              </button>}
            </div>
          ))}

          <Modal isOpen={modalHistoria} onClose={() => setModalHistoria(false)} title="Nueva Entrada - Historia Clínica" size="lg">
            <form onSubmit={guardarHistoria} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-surface-500 mb-2"><span>Paso {pasoHistoria} de {formHistoria.tipo_nota === 'inicial' ? 4 : 3}</span><span>{Math.round((pasoHistoria / (formHistoria.tipo_nota === 'inicial' ? 4 : 3)) * 100)}%</span></div>
                <div className="h-2 rounded-full bg-surface-100 overflow-hidden"><div className="h-full bg-primary-500 transition-all" style={{ width: `${(pasoHistoria / (formHistoria.tipo_nota === 'inicial' ? 4 : 3)) * 100}%` }} /></div>
              </div>
              {pasoHistoria === 1 && <>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Tipo de atención *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setFormHistoria({ ...formHistoria, tipo_nota: 'inicial' })} className={`p-3 rounded-xl border text-sm font-medium ${formHistoria.tipo_nota === 'inicial' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200'}`}>Primera consulta · extensa</button>
                  <button type="button" onClick={() => setFormHistoria({ ...formHistoria, tipo_nota: 'subsecuente' })} className={`p-3 rounded-xl border text-sm font-medium ${formHistoria.tipo_nota === 'subsecuente' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200'}`}>Consulta subsecuente · básica</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Motivo de consulta *</label>
                <textarea required value={formHistoria.motivo_consulta} onChange={e => setFormHistoria({ ...formHistoria, motivo_consulta: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">{formHistoria.tipo_nota === 'inicial' ? 'Padecimiento actual y evolución *' : 'Evolución desde la consulta anterior'}</label>
                <textarea required={formHistoria.tipo_nota === 'inicial'} value={formHistoria.interrogatorio} onChange={e => setFormHistoria({ ...formHistoria, interrogatorio: e.target.value })} className="input-field" rows={3} />
                {formHistoria.tipo_nota === 'subsecuente' && <button type="button" onClick={() => setFormHistoria({ ...formHistoria, interrogatorio: 'Sin cambios clínicos referidos desde la consulta anterior.' })} className="mt-2 text-xs font-medium text-primary-600">Marcar sin cambios referidos</button>}
              </div>
              </>}
              {formHistoria.tipo_nota === 'inicial' && pasoHistoria === 2 && <>
              <fieldset className="border border-surface-200 rounded-xl p-4 space-y-3">
                <legend className="px-2 text-sm font-semibold text-primary-700">Antecedentes de primera consulta</legend>
                {[
                  ['heredofamiliares', 'Heredofamiliares', 'detalle_heredofamiliares'],
                  ['patologicos', 'Personales patológicos', 'detalle_patologicos'],
                  ['no_patologicos', 'Personales no patológicos', 'detalle_no_patologicos'],
                  ['odontologicos', 'Antecedentes odontológicos', 'detalle_odontologicos'],
                  ['habitos', 'Hábitos orales', 'detalle_habitos'],
                  ['sistemas', 'Datos positivos por aparatos y sistemas', 'detalle_sistemas']
                ].map(([grupo, titulo, detalle]) => <div key={grupo} className="rounded-xl bg-surface-50 p-3">
                  <p className="text-sm font-medium text-primary-900 mb-2">{titulo}</p>
                  <div className="flex flex-wrap gap-2">
                    {opcionesAntecedentes[grupo].map(opcion => <label key={opcion} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs ${cuestionario[grupo].includes(opcion) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 bg-white text-surface-600'}`}>
                      <input type="checkbox" checked={cuestionario[grupo].includes(opcion)} onChange={() => alternarAntecedente(grupo, opcion)} /> {opcion}
                    </label>)}
                  </div>
                  {(cuestionario[grupo].length > 0 || cuestionario[detalle]) && <textarea value={cuestionario[detalle]} onChange={e => setCuestionario({ ...cuestionario, [detalle]: e.target.value })} className="input-field mt-3" rows={2} placeholder="Detalles, fechas, tratamiento o información adicional" />}
                </div>)}
                <p className="text-xs text-surface-500">Las categorías sin seleccionar se guardarán como “Ninguno referido”.</p>
              </fieldset>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Exploración extraoral</label>
                  <textarea value={formHistoria.exploracion_extraoral} onChange={e => setFormHistoria({ ...formHistoria, exploracion_extraoral: e.target.value })} className="input-field" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Exploración intraoral</label>
                  <textarea required value={formHistoria.exploracion_intraoral} onChange={e => setFormHistoria({ ...formHistoria, exploracion_intraoral: e.target.value })} className="input-field" rows={3} />
                </div>
              </div>
              </>}
              {pasoHistoria === (formHistoria.tipo_nota === 'inicial' ? 3 : 2) &&
              <fieldset className="border border-surface-200 rounded-xl p-4">
                <legend className="px-2 text-sm font-medium text-surface-600">Signos vitales y somatometría</legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <input value={formHistoria.presion_arterial} onChange={e => setFormHistoria({ ...formHistoria, presion_arterial: e.target.value })} className="input-field" placeholder="TA 120/80" pattern="[0-9]{2,3}/[0-9]{2,3}" />
                  <input type="number" min="20" max="250" value={formHistoria.frecuencia_cardiaca} onChange={e => setFormHistoria({ ...formHistoria, frecuencia_cardiaca: e.target.value })} className="input-field" placeholder="FC lpm" />
                  <input type="number" min="5" max="80" value={formHistoria.frecuencia_respiratoria} onChange={e => setFormHistoria({ ...formHistoria, frecuencia_respiratoria: e.target.value })} className="input-field" placeholder="FR rpm" />
                  <input type="number" min="30" max="45" step="0.1" value={formHistoria.temperatura} onChange={e => setFormHistoria({ ...formHistoria, temperatura: e.target.value })} className="input-field" placeholder="Temperatura °C" />
                  <input type="number" min="1" max="500" step="0.01" value={formHistoria.peso} onChange={e => setFormHistoria({ ...formHistoria, peso: e.target.value })} className="input-field" placeholder="Peso kg" />
                  <input type="number" min="30" max="250" step="0.1" value={formHistoria.talla} onChange={e => setFormHistoria({ ...formHistoria, talla: e.target.value })} className="input-field" placeholder="Talla cm" />
                </div>
              </fieldset>}
              {pasoHistoria === (formHistoria.tipo_nota === 'inicial' ? 4 : 3) && <>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Diagnóstico o problemas clínicos *</label>
                <textarea required value={formHistoria.diagnostico} onChange={e => setFormHistoria({ ...formHistoria, diagnostico: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Pronóstico</label>
                <textarea value={formHistoria.pronostico} onChange={e => setFormHistoria({ ...formHistoria, pronostico: e.target.value })} className="input-field" rows={2} />
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
                <label className="block text-sm font-medium text-surface-600 mb-1">Plan de tratamiento *</label>
                <textarea required value={formHistoria.receta} onChange={e => setFormHistoria({ ...formHistoria, receta: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Indicaciones al paciente</label>
                <textarea value={formHistoria.indicaciones} onChange={e => setFormHistoria({ ...formHistoria, indicaciones: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Notas</label>
                <textarea value={formHistoria.notas} onChange={e => setFormHistoria({ ...formHistoria, notas: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Imágenes y estudios PDF</label>
                <label className="border-2 border-dashed border-surface-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                  <div className="flex items-center gap-2 text-primary-600 font-medium"><FiUploadCloud size={20} /> Seleccionar archivos</div>
                  <span className="text-xs text-surface-500 mt-1">JPG, PNG, WEBP o PDF · máximo 10 MB por archivo</span>
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (validarArchivos(files)) setArchivosHistoria(files);
                  }} />
                </label>
                {archivosHistoria.length > 0 && (
                  <div className="mt-2 text-sm text-surface-600 flex items-center gap-2">
                    <FiImage /> {archivosHistoria.length} archivo{archivosHistoria.length !== 1 ? 's' : ''} seleccionado{archivosHistoria.length !== 1 ? 's' : ''}
                    <button type="button" onClick={() => setArchivosHistoria([])} className="text-red-500 ml-auto">Quitar</button>
                  </div>
                )}
              </div>
              </>}
              <div className="flex justify-end gap-3">
                {pasoHistoria === 1 ? <button type="button" onClick={() => { setModalHistoria(false); setArchivosHistoria([]); setPasoHistoria(1); }} className="btn-secondary">Cancelar</button> : <button type="button" onClick={() => setPasoHistoria(paso => paso - 1)} className="btn-secondary">Anterior</button>}
                {pasoHistoria < (formHistoria.tipo_nota === 'inicial' ? 4 : 3)
                  ? <button type="button" onClick={avanzarHistoria} className="btn-primary">Siguiente</button>
                  : <button type="submit" disabled={subiendoArchivos !== null} className="btn-primary disabled:opacity-50">{subiendoArchivos !== null ? 'Guardando...' : 'Revisar y guardar'}</button>}
              </div>
            </form>
          </Modal>

          <Modal isOpen={modalAdenda} onClose={() => { setModalAdenda(false); setHistoriaOrigen(null); }} title="Agregar adenda a la nota clínica" size="lg">
            <form onSubmit={guardarAdenda} className="space-y-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                La nota original no se modificará. La adenda quedará fechada, firmada y vinculada al registro #{historiaOrigen?.id}.
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Motivo de la adenda *</label>
                <textarea required value={formAdenda.motivo_adenda} onChange={e => setFormAdenda({ ...formAdenda, motivo_adenda: e.target.value })} className="input-field" rows={2} placeholder="Explique por qué se agrega esta información" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Diagnóstico complementario</label>
                <textarea value={formAdenda.diagnostico} onChange={e => setFormAdenda({ ...formAdenda, diagnostico: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Tratamiento o aclaración</label>
                <textarea value={formAdenda.tratamiento_realizado} onChange={e => setFormAdenda({ ...formAdenda, tratamiento_realizado: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Piezas relacionadas</label>
                <input value={formAdenda.piezas_tratadas} onChange={e => setFormAdenda({ ...formAdenda, piezas_tratadas: e.target.value })} className="input-field" placeholder="Ej: 11, 21, 36" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Plan de tratamiento complementario</label>
                <textarea value={formAdenda.receta} onChange={e => setFormAdenda({ ...formAdenda, receta: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Notas</label>
                <textarea value={formAdenda.notas} onChange={e => setFormAdenda({ ...formAdenda, notas: e.target.value })} className="input-field" rows={2} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setModalAdenda(false); setHistoriaOrigen(null); }} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Registrar adenda</button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* Tab Consentimientos */}
      {tab === 'consentimientos' && (
        <div className="space-y-4">
          <button onClick={() => { setFormConsent({ doctor_id: usuario?.rol === 'doctor' ? String(usuario.id) : '', tipo: '', contenido: '' }); setModalConsentimiento(true); }} className="btn-primary flex items-center gap-2">
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
                  ) : puedeModificarClinico ? (
                    <button onClick={() => { setConsentimientoFirma(c); setFormFirma({ firmante_nombre: `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim(), firmante_caracter: 'paciente', aceptacion_explicita: false }); setModalFirmaConsentimiento(true); }} className="btn-success text-xs px-3 py-1">
                      Firmar
                    </button>
                  ) : <span className="badge bg-gray-100 text-gray-600">Pendiente</span>}
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
                <label className="block text-sm font-medium text-surface-600 mb-1">Doctor responsable *</label>
                <select value={formConsent.doctor_id} onChange={e => setFormConsent({ ...formConsent, doctor_id: e.target.value })} className="input-field" required disabled={usuario?.rol === 'doctor'}>
                  <option value="">Seleccionar doctor...</option>
                  {doctores.map(d => <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido}{d.cedula ? ` · Cédula ${d.cedula}` : ''}</option>)}
                </select>
                {usuario?.rol === 'doctor' && <p className="text-xs text-surface-500 mt-1">El consentimiento quedará asignado a tu usuario.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Plantilla</label>
                <select
                  className="input-field"
                  onChange={e => {
                    const p = plantillas.find(pl => pl.tipo === e.target.value);
                    if (p) setFormConsent(actual => ({ ...actual, tipo: p.tipo, contenido: p.contenido }));
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

          <Modal isOpen={modalFirmaConsentimiento} onClose={() => { setModalFirmaConsentimiento(false); setConsentimientoFirma(null); }} title="Confirmar consentimiento informado" size="lg">
            <form onSubmit={firmarConsentimiento} className="space-y-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                Confirma que el contenido fue explicado, que se resolvieron las dudas y que el firmante manifestó su voluntad. Después de confirmar, el documento será inmutable.
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Nombre completo del firmante *</label>
                <input required value={formFirma.firmante_nombre} onChange={e => setFormFirma({ ...formFirma, firmante_nombre: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Firma en carácter de *</label>
                <select required value={formFirma.firmante_caracter} onChange={e => setFormFirma({ ...formFirma, firmante_caracter: e.target.value })} className="input-field">
                  <option value="paciente">Paciente</option>
                  <option value="madre_padre">Madre o padre</option>
                  <option value="tutor">Tutor</option>
                  <option value="representante_legal">Representante legal</option>
                </select>
              </div>
              <label className="flex items-start gap-3 text-sm text-surface-700">
                <input type="checkbox" required checked={formFirma.aceptacion_explicita} onChange={e => setFormFirma({ ...formFirma, aceptacion_explicita: e.target.checked })} className="mt-1" />
                <span>El firmante declara haber recibido y comprendido la información, riesgos, beneficios y alternativas, y acepta libremente el procedimiento descrito.</span>
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setModalFirmaConsentimiento(false); setConsentimientoFirma(null); }} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Aceptar y firmar</button>
              </div>
            </form>
          </Modal>
        </div>
      )}

       {/* Tab Cita */}
      {tab === 'citas' && (
        <div className="space-y-4">

          <button
            onClick={() => setModalCita(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiCalendar size={16} /> Agendar Cita
          </button>

          <div className="card">
            <h3 className="font-semibold text-primary-900 mb-4">
              Historial de Citas
            </h3>

            {!paciente.citas?.length ? (
              <p className="text-gray-500 text-sm">
                Sin citas registradas
              </p>
            ) : (
              <div className="space-y-2">
                {paciente.citas.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3.5 bg-surface-50 rounded-2xl text-sm border border-surface-100"
                  >
                    <div>
                      <span className="font-semibold text-primary-800">
                        {c.fecha}
                      </span>{' '}
                      - {c.hora_inicio?.slice(0,5)}

                      <span className="ml-2 text-surface-500">
                        {c.motivo || 'Consulta'}
                      </span>

                      {c.doctor && (
                        <span className="ml-2 text-surface-400">
                          - Dr. {c.doctor.apellido}
                        </span>
                      )}
                    </div>

                    <span
                      className={`badge ${
                        c.estado === 'completada'
                          ? 'bg-green-100 text-green-700'
                          : c.estado === 'cancelada'
                          ? 'bg-red-100 text-red-700'
                          : c.estado === 'no_asistio'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {c.estado?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Cita */}
          <Modal
            isOpen={modalCita}
            onClose={() => setModalCita(false)}
            title="Agendar Cita"
          >
            <form onSubmit={crearCita} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">
                  Doctor *
                </label>

                <select
                  value={formCita.doctor_id}
                  onChange={e =>
                    setFormCita({
                      ...formCita,
                      doctor_id: e.target.value
                    })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Seleccionar doctor</option>

                  {doctores.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.nombre} {d.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalCita(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary">
                  Agendar
                </button>
              </div>

            </form>
          </Modal>

        </div>
      )}
     {/* Tab Recetas */}
{tab === 'recetas' && (
  <div className="space-y-6">

    {/* HEADER PREMIUM */}
    <div className="flex items-center justify-between bg-gradient-to-r from-white via-slate-50 to-white border border-amber-100/40 rounded-3xl p-6 shadow-sm">

      <div className="flex items-center gap-4">

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center border border-amber-200/50 shadow-sm">
          <FiFileText className="text-amber-700" size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Recetas Médicas
          </h2>

          <p className="text-sm text-slate-500">
            Gestión de recetas premium del paciente
          </p>
        </div>

      </div>

      <button
        onClick={() => setModalReceta(true)}
        className="px-5 py-3 rounded-2xl bg-[#c8a24a] hover:bg-[#b8923f] text-white font-semibold shadow-sm transition-all flex items-center gap-2"
      >
        <FiPlus size={18} />
        Nueva Receta
      </button>

    </div>

    {/* SIN RECETAS */}
    {!loadingRecetas && recetas.length === 0 && (
      <div className="bg-white rounded-3xl border border-slate-200/60 p-14 text-center shadow-sm">

        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5 border border-amber-100">
          <FiFileText className="text-amber-700" size={34} />
        </div>

        <h3 className="text-lg font-bold text-slate-700">
          No hay recetas registradas
        </h3>

        <p className="text-slate-500 mt-2">
          Crea la primera receta médica del paciente
        </p>

      </div>
    )}

    {/* LOADING */}
    {loadingRecetas && (
      <div className="text-center py-10 text-slate-500">
        Cargando recetas...
      </div>
    )}

    {/* LISTADO */}
    <div className="grid gap-5">

      {recetas.map(r => (

        <div
          key={r.id}
          className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm hover:shadow-xl transition-all"
        >

          {/* DECORACIÓN */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#f3e7c3] via-[#e0c98a] to-[#c8a24a]" />

          <div className="p-6">

            {/* TOP */}
            <div className="flex items-start justify-between mb-5">

              <div className="flex items-start gap-4">

                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center border border-amber-200/50 shadow-sm">
                  <FiAward className="text-amber-700" size={22} />
                </div>

                <div>

                  <div className="flex items-center gap-2 flex-wrap">

                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wide border border-amber-100">
                      Folio {r.folio}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                      {new Date(r.createdAt).toLocaleDateString('es-MX')}
                    </span>

                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FiUser size={16} />
                    Dr. {r.doctor?.nombre} {r.doctor?.apellido}
                  </h3>

                </div>

              </div>

              {/* BOTONES */}
              <div className="flex items-center gap-2">

                <button
                  onClick={() => imprimirReceta(r)}
                  className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all flex items-center justify-center"
                  title="Imprimir"
                >
                  <FiPrinter size={18} />
                </button>

                <button
                  onClick={() => abrirEditarReceta(r)}
                  className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-all flex items-center justify-center"
                  title="Editar"
                >
                  <FiEdit2 size={18} />
                </button>

                <button
                  onClick={() => eliminarReceta(r.id)}
                  className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 transition-all flex items-center justify-center"
                  title="Eliminar"
                >
                  <FiTrash2 size={18} />
                </button>

              </div>

            </div>

            {/* CONTENIDO */}
            <div className="grid md:grid-cols-3 gap-4">

              <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 text-[#b8923f] font-semibold">
                  <FiAlertTriangle size={16} />
                  Diagnóstico
                </div>

                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {r.diagnostico}
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 text-[#b8923f] font-semibold">
                  <FiFileText size={16} />
                  Medicamentos
                </div>

                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {r.medicamentos}
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 text-[#b8923f] font-semibold">
                  <FiClock size={16} />
                  Indicaciones
                </div>

                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {r.indicaciones}
                </p>
              </div>

            </div>

          </div>

        </div>

      ))}

    </div>

    {/* MODAL CREAR */}
    <Modal
      isOpen={modalReceta}
      onClose={() => setModalReceta(false)}
      title="Nueva Receta Médica"
      size="lg"
    >
      <form onSubmit={guardarReceta} className="space-y-5">

        <div>
          <label className="block text-sm font-semibold mb-2">Diagnóstico</label>
          <textarea
            value={formReceta.diagnostico}
            onChange={e => setFormReceta({ ...formReceta, diagnostico: e.target.value })}
            className="input-field"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Medicamentos</label>
          <textarea
            value={formReceta.medicamentos}
            onChange={e => setFormReceta({ ...formReceta, medicamentos: e.target.value })}
            className="input-field"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Indicaciones</label>
          <textarea
            value={formReceta.indicaciones}
            onChange={e => setFormReceta({ ...formReceta, indicaciones: e.target.value })}
            className="input-field"
            rows={4}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">

          <button type="button" onClick={() => setModalReceta(false)} className="btn-secondary">
            Cancelar
          </button>

          <button type="submit" className="btn-primary">
            Guardar Receta
          </button>

        </div>

      </form>
    </Modal>

    {/* MODAL EDITAR */}
    <Modal
      isOpen={modalEditarReceta}
      onClose={() => setModalEditarReceta(false)}
      title="Editar Receta"
      size="lg"
    >
      <form onSubmit={actualizarReceta} className="space-y-5">

        <div>
          <label className="block text-sm font-semibold mb-2">Diagnóstico</label>
          <textarea
            value={formReceta.diagnostico}
            onChange={e => setFormReceta({ ...formReceta, diagnostico: e.target.value })}
            className="input-field"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Medicamentos</label>
          <textarea
            value={formReceta.medicamentos}
            onChange={e => setFormReceta({ ...formReceta, medicamentos: e.target.value })}
            className="input-field"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Indicaciones</label>
          <textarea
            value={formReceta.indicaciones}
            onChange={e => setFormReceta({ ...formReceta, indicaciones: e.target.value })}
            className="input-field"
            rows={4}
            required
          />
        </div>

        <div className="flex justify-end gap-3">

          <button type="button" onClick={() => setModalEditarReceta(false)} className="btn-secondary">
            Cancelar
          </button>

          <button type="submit" className="btn-primary">
            Guardar Cambios
          </button>

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
          {balance.presupuestos   ?.filter(p =>     ['aceptado', 'en_curso', 'finalizado'].includes(p.estado)   ).length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-primary-900">Detalle por Presupuesto</h3>
              {balance.presupuestos   .filter(p =>     ['aceptado', 'en_curso', 'finalizado'].includes(p.estado)   )   .map(p => {
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
                    {pendiente > 0 ? ( <p className="text-sm text-red-600 font-medium">
                      Pendiente: ${Number(pendiente).toLocaleString()}
                      </p> ) : ( <p className="text-sm text-green-600 font-semibold">
                              ✔ Presupuesto liquidado
                        </p>

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
                   {balance.presupuestos.map(p => { const descuento = parseFloat(p.descuento || 0); const totalPagado = parseFloat(p.pagado || 0);
                    const restante = parseFloat(p.total || 0) - descuento - totalPagado; const liquidado = restante <= 0;
                    return ( <option key={p.id} value={p.id} disabled={liquidado}>
                      #{p.id}
                      {' — '}
                      Restante: ${Number(Math.max(0, restante)).toLocaleString()}
                      {liquidado ? ' • LIQUIDADO' : ''}
                      </option>
                              );
                                })}
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

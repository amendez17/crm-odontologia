require('dotenv').config();
const { sequelize, Usuario, Paciente, Cita, Tratamiento, Presupuesto, DetallePresupuesto, Pago, HistoriaClinica, Consentimiento, Odontograma, LogActividad } = require('./models');

async function seedData() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a MySQL.');

    // Get doctors
    const doctores = await Usuario.findAll({ where: { rol: 'doctor' } });
    if (doctores.length === 0) {
      console.error('No hay doctores. Ejecuta seed.js primero.');
      process.exit(1);
    }
    const doctorIds = doctores.map(d => d.id);

    // Get treatments
    const tratamientos = await Tratamiento.findAll();
    if (tratamientos.length === 0) {
      console.error('No hay tratamientos. Ejecuta seed.js primero.');
      process.exit(1);
    }

    // --- 1. PACIENTES (10) ---
    const pacientesData = [
      { nombre: 'María', apellido: 'García', dni: '28456789', fecha_nacimiento: '1985-03-15', genero: 'femenino', telefono: '1155001234', email: 'maria.garcia@email.com', direccion: 'Av. Rivadavia 1234, CABA', obra_social: 'OSDE', numero_afiliado: 'OSE-28456789' },
      { nombre: 'Roberto', apellido: 'Fernández', dni: '31987654', fecha_nacimiento: '1978-08-22', genero: 'masculino', telefono: '1155002345', email: 'roberto.f@email.com', direccion: 'Calle San Martín 567, CABA', obra_social: 'Swiss Medical', numero_afiliado: 'SM-31987654' },
      { nombre: 'Luciana', apellido: 'Martínez', dni: '35678123', fecha_nacimiento: '1992-11-05', genero: 'femenino', telefono: '1155003456', email: 'luciana.m@email.com', direccion: 'Av. Corrientes 890, CABA', obra_social: 'Galeno', numero_afiliado: 'GAL-35678123', alergias: 'Penicilina' },
      { nombre: 'Carlos', apellido: 'López', dni: '25789456', fecha_nacimiento: '1975-01-30', genero: 'masculino', telefono: '1155004567', email: 'carlos.lopez@email.com', direccion: 'Calle Belgrano 234, Quilmes', obra_social: 'OSDE', numero_afiliado: 'OSE-25789456', antecedentes_medicos: 'Diabetes tipo 2', medicamentos: 'Metformina 500mg' },
      { nombre: 'Ana', apellido: 'Rodríguez', dni: '33456789', fecha_nacimiento: '1990-06-18', genero: 'femenino', telefono: '1155005678', email: 'ana.rod@email.com', direccion: 'Av. Santa Fe 1567, CABA', obra_social: 'Medicus' },
      { nombre: 'Diego', apellido: 'Sánchez', dni: '29876543', fecha_nacimiento: '1982-04-10', genero: 'masculino', telefono: '1155006789', email: 'diego.s@email.com', direccion: 'Calle Mitre 456, Avellaneda', obra_social: 'Swiss Medical', numero_afiliado: 'SM-29876543', alergias: 'Lidocaína' },
      { nombre: 'Valentina', apellido: 'Torres', dni: '37123456', fecha_nacimiento: '1995-09-25', genero: 'femenino', telefono: '1155007890', email: 'vale.torres@email.com', direccion: 'Av. Callao 789, CABA', antecedentes_medicos: 'Embarazo 5 meses' },
      { nombre: 'Martín', apellido: 'Díaz', dni: '27654321', fecha_nacimiento: '1980-12-03', genero: 'masculino', telefono: '1155008901', email: 'martin.diaz@email.com', direccion: 'Calle Lavalle 321, CABA', obra_social: 'OSDE', numero_afiliado: 'OSE-27654321' },
      { nombre: 'Sofía', apellido: 'Romero', dni: '34567890', fecha_nacimiento: '1988-07-14', genero: 'femenino', telefono: '1155009012', email: 'sofia.romero@email.com', direccion: 'Av. Libertador 2345, Vicente López', obra_social: 'Galeno', numero_afiliado: 'GAL-34567890', antecedentes_medicos: 'Hipertensión' },
      { nombre: 'Federico', apellido: 'Morales', dni: '30234567', fecha_nacimiento: '1983-02-28', genero: 'masculino', telefono: '1155010123', email: 'fede.morales@email.com', direccion: 'Calle Sarmiento 678, Lomas de Zamora', obra_social: 'Medicus', numero_afiliado: 'MED-30234567' },
    ];

    const pacientes = [];
    for (const p of pacientesData) {
      const [pac] = await Paciente.findOrCreate({ where: { dni: p.dni }, defaults: p });
      pacientes.push(pac);
    }
    console.log(`${pacientes.length} pacientes creados.`);

    // --- 2. CITAS (10+ con variedad de estados y fechas) ---
    const hoy = new Date();
    const fechaStr = (d) => d.toISOString().split('T')[0];
    const diasAtras = (n) => { const d = new Date(hoy); d.setDate(d.getDate() - n); return fechaStr(d); };
    const diasAdelante = (n) => { const d = new Date(hoy); d.setDate(d.getDate() + n); return fechaStr(d); };

    const citasData = [
      { paciente_id: pacientes[0].id, doctor_id: doctorIds[0], fecha: diasAtras(15), hora_inicio: '09:00', hora_fin: '09:30', motivo: 'Consulta de diagnóstico', estado: 'completada' },
      { paciente_id: pacientes[1].id, doctor_id: doctorIds[0], fecha: diasAtras(12), hora_inicio: '10:00', hora_fin: '10:45', motivo: 'Limpieza dental', estado: 'completada' },
      { paciente_id: pacientes[2].id, doctor_id: doctorIds[1], fecha: diasAtras(10), hora_inicio: '11:00', hora_fin: '12:00', motivo: 'Estudio de ortodoncia', estado: 'completada' },
      { paciente_id: pacientes[3].id, doctor_id: doctorIds[2], fecha: diasAtras(8), hora_inicio: '14:00', hora_fin: '15:30', motivo: 'Tratamiento de conducto', estado: 'completada' },
      { paciente_id: pacientes[4].id, doctor_id: doctorIds[0], fecha: diasAtras(5), hora_inicio: '09:30', hora_fin: '10:00', motivo: 'Control y revisión', estado: 'completada' },
      { paciente_id: pacientes[5].id, doctor_id: doctorIds[3], fecha: diasAtras(3), hora_inicio: '15:00', hora_fin: '16:00', motivo: 'Evaluación para implante', estado: 'completada' },
      { paciente_id: pacientes[6].id, doctor_id: doctorIds[0], fecha: diasAtras(1), hora_inicio: '10:00', hora_fin: '10:30', motivo: 'Consulta de urgencia - dolor molar', estado: 'completada' },
      { paciente_id: pacientes[0].id, doctor_id: doctorIds[0], fecha: fechaStr(hoy), hora_inicio: '09:00', hora_fin: '10:00', motivo: 'Obturación pieza 16', estado: 'programada' },
      { paciente_id: pacientes[7].id, doctor_id: doctorIds[1], fecha: fechaStr(hoy), hora_inicio: '11:00', hora_fin: '11:30', motivo: 'Control de brackets', estado: 'confirmada' },
      { paciente_id: pacientes[8].id, doctor_id: doctorIds[2], fecha: fechaStr(hoy), hora_inicio: '14:00', hora_fin: '15:00', motivo: 'Endodoncia pieza 36', estado: 'programada' },
      { paciente_id: pacientes[9].id, doctor_id: doctorIds[0], fecha: diasAdelante(1), hora_inicio: '09:00', hora_fin: '09:30', motivo: 'Consulta primera vez', estado: 'programada' },
      { paciente_id: pacientes[2].id, doctor_id: doctorIds[1], fecha: diasAdelante(2), hora_inicio: '10:00', hora_fin: '11:00', motivo: 'Colocación de brackets', estado: 'programada' },
      { paciente_id: pacientes[4].id, doctor_id: doctorIds[3], fecha: diasAdelante(3), hora_inicio: '15:00', hora_fin: '16:30', motivo: 'Cirugía de implante', estado: 'confirmada' },
      { paciente_id: pacientes[1].id, doctor_id: doctorIds[0], fecha: diasAtras(20), hora_inicio: '16:00', hora_fin: '16:30', motivo: 'Consulta de urgencia', estado: 'no_asistio' },
      { paciente_id: pacientes[5].id, doctor_id: doctorIds[2], fecha: diasAtras(7), hora_inicio: '11:00', hora_fin: '11:30', motivo: 'Pulpotomía', estado: 'cancelada' },
    ];

    let citasCreadas = 0;
    for (const c of citasData) {
      const existe = await Cita.findOne({ where: { paciente_id: c.paciente_id, fecha: c.fecha, hora_inicio: c.hora_inicio } });
      if (!existe) {
        await Cita.create(c);
        citasCreadas++;
      }
    }
    console.log(`${citasCreadas} citas creadas.`);

    // --- 3. PRESUPUESTOS (10 con detalles) ---
    const tratList = tratamientos.slice(0, 20); // Get first 20 treatments
    const presupuestosData = [
      { paciente_id: pacientes[0].id, doctor_id: doctorIds[0], estado: 'en_curso', notas: 'Tratamiento restaurador integral', detallesIdx: [7, 8] },
      { paciente_id: pacientes[1].id, doctor_id: doctorIds[0], estado: 'aceptado', notas: 'Plan preventivo', detallesIdx: [3, 4] },
      { paciente_id: pacientes[2].id, doctor_id: doctorIds[1], estado: 'aceptado', notas: 'Tratamiento de ortodoncia completo', detallesIdx: [0, 1] },
      { paciente_id: pacientes[3].id, doctor_id: doctorIds[2], estado: 'finalizado', notas: 'Endodoncia y corona', detallesIdx: [11, 12] },
      { paciente_id: pacientes[4].id, doctor_id: doctorIds[3], estado: 'aceptado', notas: 'Implante dental zona 36', detallesIdx: [0, 2] },
      { paciente_id: pacientes[5].id, doctor_id: doctorIds[0], estado: 'pendiente', notas: 'Extracción + implante', detallesIdx: [7, 9] },
      { paciente_id: pacientes[6].id, doctor_id: doctorIds[0], estado: 'en_curso', notas: 'Urgencia molar', detallesIdx: [0, 7] },
      { paciente_id: pacientes[7].id, doctor_id: doctorIds[1], estado: 'aceptado', notas: 'Ortodoncia brackets metálicos', detallesIdx: [0, 3] },
      { paciente_id: pacientes[8].id, doctor_id: doctorIds[2], estado: 'pendiente', notas: 'Endodoncia múltiple', detallesIdx: [11, 13] },
      { paciente_id: pacientes[9].id, doctor_id: doctorIds[0], estado: 'pendiente', notas: 'Diagnóstico integral', detallesIdx: [0, 3, 4] },
    ];

    const presupuestos = [];
    for (const pData of presupuestosData) {
      const existe = await Presupuesto.findOne({ where: { paciente_id: pData.paciente_id, doctor_id: pData.doctor_id, notas: pData.notas } });
      if (existe) { presupuestos.push(existe); continue; }

      let total = 0;
      const detalles = pData.detallesIdx.map(idx => {
        const t = tratList[idx % tratList.length];
        total += parseFloat(t.precio);
        return { tratamiento_id: t.id, precio: t.precio, pieza_dental: Math.floor(Math.random() * 32) + 11 };
      });

      const presup = await Presupuesto.create({
        paciente_id: pData.paciente_id,
        doctor_id: pData.doctor_id,
        estado: pData.estado,
        notas: pData.notas,
        total,
        descuento: pData.estado === 'finalizado' ? 5000 : 0
      });

      for (const det of detalles) {
        await DetallePresupuesto.create({ ...det, presupuesto_id: presup.id });
      }
      presupuestos.push(presup);
    }
    console.log(`${presupuestos.length} presupuestos creados.`);

    // --- 4. PAGOS (10) ---
    const pagosData = [
      { paciente_id: pacientes[0].id, presupuesto_id: presupuestos[0]?.id, monto: 15000, metodo_pago: 'efectivo', fecha: diasAtras(14), numero_recibo: 'R-001' },
      { paciente_id: pacientes[0].id, presupuesto_id: presupuestos[0]?.id, monto: 10000, metodo_pago: 'tarjeta_debito', fecha: diasAtras(7), numero_recibo: 'R-002' },
      { paciente_id: pacientes[1].id, presupuesto_id: presupuestos[1]?.id, monto: 12000, metodo_pago: 'transferencia', fecha: diasAtras(11), numero_recibo: 'R-003' },
      { paciente_id: pacientes[2].id, presupuesto_id: presupuestos[2]?.id, monto: 50000, metodo_pago: 'tarjeta_credito', fecha: diasAtras(9), numero_recibo: 'R-004' },
      { paciente_id: pacientes[3].id, presupuesto_id: presupuestos[3]?.id, monto: 95000, metodo_pago: 'transferencia', fecha: diasAtras(6), numero_recibo: 'R-005' },
      { paciente_id: pacientes[4].id, presupuesto_id: presupuestos[4]?.id, monto: 125000, metodo_pago: 'tarjeta_credito', fecha: diasAtras(4), numero_recibo: 'R-006' },
      { paciente_id: pacientes[5].id, monto: 8000, metodo_pago: 'efectivo', fecha: diasAtras(3), numero_recibo: 'R-007', notas: 'Consulta de urgencia' },
      { paciente_id: pacientes[6].id, presupuesto_id: presupuestos[6]?.id, monto: 5000, metodo_pago: 'efectivo', fecha: diasAtras(1), numero_recibo: 'R-008' },
      { paciente_id: pacientes[7].id, presupuesto_id: presupuestos[7]?.id, monto: 25000, metodo_pago: 'transferencia', fecha: diasAtras(2), numero_recibo: 'R-009' },
      { paciente_id: pacientes[8].id, monto: 35000, metodo_pago: 'tarjeta_debito', fecha: fechaStr(hoy), numero_recibo: 'R-010', notas: 'Seña para tratamiento' },
    ];

    let pagosCreados = 0;
    for (const p of pagosData) {
      const existe = await Pago.findOne({ where: { numero_recibo: p.numero_recibo } });
      if (!existe) {
        await Pago.create(p);
        pagosCreados++;
      }
    }
    console.log(`${pagosCreados} pagos creados.`);

    // --- 5. HISTORIA CLÍNICA (10 registros) ---
    const historiasData = [
      { paciente_id: pacientes[0].id, doctor_id: doctorIds[0], fecha: diasAtras(15), diagnostico: 'Caries en pieza 16 y 26', tratamiento_realizado: 'Radiografía panorámica, evaluación general', piezas_tratadas: '16, 26' },
      { paciente_id: pacientes[1].id, doctor_id: doctorIds[0], fecha: diasAtras(12), diagnostico: 'Placa bacteriana moderada', tratamiento_realizado: 'Profilaxis dental completa con ultrasonido', notas: 'Se recomienda control en 6 meses' },
      { paciente_id: pacientes[2].id, doctor_id: doctorIds[1], fecha: diasAtras(10), diagnostico: 'Maloclusión clase II', tratamiento_realizado: 'Toma de modelos, fotografías y radiografías para estudio', notas: 'Se planifica ortodoncia con brackets estéticos' },
      { paciente_id: pacientes[3].id, doctor_id: doctorIds[2], fecha: diasAtras(8), diagnostico: 'Pulpitis irreversible pieza 46', tratamiento_realizado: 'Tratamiento de conducto birradicular pieza 46', piezas_tratadas: '46', receta: 'Ibuprofeno 600mg c/8hs por 3 días, Amoxicilina 500mg c/8hs por 7 días' },
      { paciente_id: pacientes[4].id, doctor_id: doctorIds[0], fecha: diasAtras(5), diagnostico: 'Control post-tratamiento', tratamiento_realizado: 'Revisión general, todo en orden', notas: 'Paciente sin molestias. Próximo control en 3 meses' },
      { paciente_id: pacientes[5].id, doctor_id: doctorIds[3], fecha: diasAtras(3), diagnostico: 'Ausencia pieza 36, reabsorción ósea leve', tratamiento_realizado: 'Tomografía CBCT, planificación de implante', piezas_tratadas: '36', notas: 'Hueso suficiente para implante directo sin injerto' },
      { paciente_id: pacientes[6].id, doctor_id: doctorIds[0], fecha: diasAtras(1), diagnostico: 'Dolor agudo molar 48 - pericoronaritis', tratamiento_realizado: 'Drenaje de absceso, medicación', piezas_tratadas: '48', receta: 'Ketorolac 10mg c/8hs, Metronidazol 500mg c/8hs por 5 días' },
      { paciente_id: pacientes[0].id, doctor_id: doctorIds[0], fecha: diasAtras(14), diagnostico: 'Caries profunda pieza 16', tratamiento_realizado: 'Obturación compuesta con resina fotocurada', piezas_tratadas: '16' },
      { paciente_id: pacientes[3].id, doctor_id: doctorIds[2], fecha: diasAtras(6), diagnostico: 'Control post-endodoncia pieza 46', tratamiento_realizado: 'Radiografía de control, obturación definitiva y tallado para corona', piezas_tratadas: '46', notas: 'Conductos en perfecto estado. Se prepara para corona de zirconio' },
      { paciente_id: pacientes[8].id, doctor_id: doctorIds[2], fecha: diasAtras(2), diagnostico: 'Caries extensas en piezas 15 y 25', tratamiento_realizado: 'Radiografías periapicales, evaluación de vitalidad pulpar', piezas_tratadas: '15, 25', notas: 'Pieza 15 responde positivo a test frío, pieza 25 no responde - necrótica' },
    ];

    let historiasCreadas = 0;
    for (const h of historiasData) {
      const existe = await HistoriaClinica.findOne({ where: { paciente_id: h.paciente_id, fecha: h.fecha, doctor_id: h.doctor_id } });
      if (!existe) {
        await HistoriaClinica.create(h);
        historiasCreadas++;
      }
    }
    console.log(`${historiasCreadas} registros de historia clínica creados.`);

    // --- 6. CONSENTIMIENTOS (10) ---
    const consentimientosData = [
      { paciente_id: pacientes[3].id, doctor_id: doctorIds[2], tipo: 'Tratamiento de Conducto', contenido: 'Yo, Carlos López...', firmado: true, fecha_firma: new Date(diasAtras(8)) },
      { paciente_id: pacientes[5].id, doctor_id: doctorIds[3], tipo: 'Implante Dental', contenido: 'Yo, Diego Sánchez...', firmado: false },
      { paciente_id: pacientes[2].id, doctor_id: doctorIds[1], tipo: 'Ortodoncia', contenido: 'Yo, Luciana Martínez...', firmado: true, fecha_firma: new Date(diasAtras(10)) },
      { paciente_id: pacientes[6].id, doctor_id: doctorIds[0], tipo: 'Extracción Dental', contenido: 'Yo, Valentina Torres...', firmado: true, fecha_firma: new Date(diasAtras(1)) },
      { paciente_id: pacientes[8].id, doctor_id: doctorIds[2], tipo: 'Endodoncia', contenido: 'Yo, Sofía Romero...', firmado: false },
      { paciente_id: pacientes[0].id, doctor_id: doctorIds[0], tipo: 'Restauración', contenido: 'Autorizo la obturación de pieza 16...', firmado: true, fecha_firma: new Date(diasAtras(14)) },
      { paciente_id: pacientes[1].id, doctor_id: doctorIds[0], tipo: 'Profilaxis', contenido: 'Autorizo limpieza...', firmado: true, fecha_firma: new Date(diasAtras(12)) },
      { paciente_id: pacientes[4].id, doctor_id: doctorIds[3], tipo: 'Cirugía', contenido: 'Autorizo injerto óseo...', firmado: true, fecha_firma: new Date(diasAtras(5)) },
      { paciente_id: pacientes[7].id, doctor_id: doctorIds[1], tipo: 'Ortodoncia Metálica', contenido: 'Autorizo instalación de brackets...', firmado: true, fecha_firma: new Date(diasAtras(2)) },
      { paciente_id: pacientes[9].id, doctor_id: doctorIds[0], tipo: 'Diagnóstico general', contenido: 'Autorizo toma de radiografías...', firmado: true, fecha_firma: new Date() },
    ];

    let consCreados = 0;
    for (const c of consentimientosData) {
      const existe = await Consentimiento.findOne({ where: { paciente_id: c.paciente_id, tipo: c.tipo } });
      if (!existe) {
        await Consentimiento.create(c);
        consCreados++;
      }
    }
    console.log(`${consCreados} consentimientos creados.`);

    // --- 7. ODONTOGRAMAS (10) ---
    const odontogramasData = [
      { paciente_id: pacientes[0].id, doctor_id: doctorIds[0], pieza_dental: 16, cara: 'oclusal', estado: 'caries', observacion: 'Caries profunda' },
      { paciente_id: pacientes[0].id, doctor_id: doctorIds[0], pieza_dental: 26, cara: 'distal', estado: 'obturacion', observacion: 'Resina en buen estado' },
      { paciente_id: pacientes[3].id, doctor_id: doctorIds[2], pieza_dental: 46, cara: 'completa', estado: 'endodoncia', observacion: 'Conducto realizado' },
      { paciente_id: pacientes[5].id, doctor_id: doctorIds[3], pieza_dental: 36, cara: 'completa', estado: 'ausente', observacion: 'Pieza extraída previamente' },
      { paciente_id: pacientes[6].id, doctor_id: doctorIds[0], pieza_dental: 48, cara: 'completa', estado: 'extraccion', observacion: 'Indicada para extracción' },
      { paciente_id: pacientes[8].id, doctor_id: doctorIds[2], pieza_dental: 15, cara: 'mesial', estado: 'caries', observacion: 'Caries leve' },
      { paciente_id: pacientes[8].id, doctor_id: doctorIds[2], pieza_dental: 25, cara: 'completa', estado: 'caries', observacion: 'Pieza necrótica' },
      { paciente_id: pacientes[2].id, doctor_id: doctorIds[1], pieza_dental: 11, cara: 'vestibular', estado: 'sano', observacion: 'Control ortodoncia' },
      { paciente_id: pacientes[2].id, doctor_id: doctorIds[1], pieza_dental: 21, cara: 'vestibular', estado: 'sano', observacion: 'Control ortodoncia' },
      { paciente_id: pacientes[4].id, doctor_id: doctorIds[3], pieza_dental: 36, cara: 'completa', estado: 'implante', observacion: 'Implante planificado' }
    ];

    let odontoCreados = 0;
    for (const o of odontogramasData) {
      const existe = await Odontograma.findOne({ where: { paciente_id: o.paciente_id, pieza_dental: o.pieza_dental } });
      if (!existe) {
        await Odontograma.create(o);
        odontoCreados++;
      }
    }
    console.log(`${odontoCreados} odontogramas creados.`);

    // --- 8. LOG ACTIVIDAD (10) ---
    const logsData = [
      { usuario_id: doctorIds[0], accion: 'login', entidad: 'sistema', detalle: 'Inicio de sesión exitoso' },
      { usuario_id: doctorIds[0], accion: 'crear', entidad: 'paciente', entidad_id: pacientes[0].id, detalle: 'Se registró nuevo paciente' },
      { usuario_id: doctorIds[1], accion: 'actualizar', entidad: 'cita', entidad_id: 3, detalle: 'Cambio de estado a completada' },
      { usuario_id: doctorIds[2], accion: 'crear', entidad: 'presupuesto', entidad_id: 1, detalle: 'Presupuesto generado' },
      { usuario_id: doctorIds[3], accion: 'crear', entidad: 'historia_clinica', entidad_id: 1, detalle: 'Registro de historia actualizado' },
      { usuario_id: doctorIds[0], accion: 'crear', entidad: 'pago', entidad_id: 1, detalle: 'Pago recibido en efectivo' },
      { usuario_id: doctorIds[1], accion: 'actualizar', entidad: 'presupuesto', entidad_id: 2, detalle: 'Presupuesto aceptado por paciente' },
      { usuario_id: doctorIds[0], accion: 'eliminar', entidad: 'cita', entidad_id: 15, detalle: 'Cita cancelada por el paciente' },
      { usuario_id: doctorIds[2], accion: 'crear', entidad: 'odontograma', entidad_id: 3, detalle: 'Pieza 46 marcada con endodoncia' },
      { usuario_id: doctorIds[3], accion: 'logout', entidad: 'sistema', detalle: 'Cierre de sesión' },
    ];

    let logsCreados = 0;
    for (const l of logsData) {
      await LogActividad.create(l);
      logsCreados++;
    }
    console.log(`${logsCreados} logs de actividad creados.`);

    console.log('\n=== DATOS DE EJEMPLO CARGADOS ===');
    console.log('- 10 pacientes');
    console.log('- 15 citas (pasadas, hoy, futuras)');
    console.log('- 10 presupuestos con detalles');
    console.log('- 10 pagos');
    console.log('- 10 registros de historia clínica');
    console.log('- 10 consentimientos informados');
    console.log('- 10 odontogramas');
    console.log('- 10 logs de actividad');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedData();

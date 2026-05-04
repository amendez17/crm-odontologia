// seed.js — Datos iniciales realistas para OdontoCRM
// Ejecutar con: node seed.js (desde la carpeta server/)
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function seed() {
  const {
    sequelize, Usuario, Paciente, CategoriaTratamiento, Tratamiento,
    Cita, Presupuesto, DetallePresupuesto, Pago,
    Odontograma, HistoriaClinica, Consentimiento, LogActividad
  } = require('./src/models');

  await sequelize.authenticate();
  console.log('✓ Conexión a base de datos establecida\n');

  // ── USUARIOS (doctores + recepcionista) ────────────────────────────────────
  console.log('→ Creando usuarios...');
  const hash = await bcrypt.hash('clinica123', 10);

  const [doc1] = await Usuario.findOrCreate({
    where: { email: 'carlos.mendoza@clinica.com' },
    defaults: { nombre: 'Carlos', apellido: 'Mendoza', password: hash, rol: 'doctor', especialidad: 'Odontología General', telefono: '11-2345-6789', activo: true }
  });
  const [doc2] = await Usuario.findOrCreate({
    where: { email: 'ana.rodriguez@clinica.com' },
    defaults: { nombre: 'Ana', apellido: 'Rodríguez', password: hash, rol: 'doctor', especialidad: 'Ortodoncia', telefono: '11-3456-7890', activo: true }
  });
  const [doc3] = await Usuario.findOrCreate({
    where: { email: 'lucas.fernandez@clinica.com' },
    defaults: { nombre: 'Lucas', apellido: 'Fernández', password: hash, rol: 'doctor', especialidad: 'Cirugía e Implantología', telefono: '11-4567-8901', activo: true }
  });
  await Usuario.findOrCreate({
    where: { email: 'maria.garcia@clinica.com' },
    defaults: { nombre: 'María', apellido: 'García', password: hash, rol: 'recepcionista', telefono: '11-5678-9012', activo: true }
  });
  const doctores = [doc1, doc2, doc3];
  console.log(`  ✓ ${doctores.length} doctores + 1 recepcionista\n`);

  // ── CATEGORÍAS DE TRATAMIENTO ──────────────────────────────────────────────
  console.log('→ Creando categorías y tratamientos...');
  const catDefs = [
    { nombre: 'Odontología General',  descripcion: 'Consultas, limpiezas y tratamientos preventivos' },
    { nombre: 'Ortodoncia',           descripcion: 'Corrección de la posición dental y mandibular' },
    { nombre: 'Endodoncia',           descripcion: 'Tratamiento del canal radicular' },
    { nombre: 'Cirugía Bucal',        descripcion: 'Extracciones y procedimientos quirúrgicos' },
    { nombre: 'Estética Dental',      descripcion: 'Blanqueamiento, carillas y mejoras estéticas' },
    { nombre: 'Implantología',        descripcion: 'Implantes dentales y prótesis sobre implantes' },
  ];
  const cats = [];
  for (const c of catDefs) {
    const [cat] = await CategoriaTratamiento.findOrCreate({ where: { nombre: c.nombre }, defaults: c });
    cats.push(cat);
  }

  // ── TRATAMIENTOS (20) ──────────────────────────────────────────────────────
  const tratDefs = [
    // Odontología General
    { ci: 0, nombre: 'Consulta y diagnóstico',          precio: 8000,   dur: 30 },
    { ci: 0, nombre: 'Limpieza dental (profilaxis)',     precio: 12000,  dur: 45 },
    { ci: 0, nombre: 'Obturación simple (resina)',       precio: 15000,  dur: 45 },
    { ci: 0, nombre: 'Obturación compuesta (resina)',    precio: 22000,  dur: 60 },
    { ci: 0, nombre: 'Fluoración',                       precio: 8000,   dur: 20 },
    { ci: 0, nombre: 'Radiografía periapical',           precio: 6000,   dur: 15 },
    // Ortodoncia
    { ci: 1, nombre: 'Brackets metálicos (completo)',    precio: 280000, dur: 90 },
    { ci: 1, nombre: 'Brackets cerámicos (completo)',    precio: 350000, dur: 90 },
    { ci: 1, nombre: 'Consulta ortodoncia + plan',       precio: 12000,  dur: 60 },
    // Endodoncia
    { ci: 2, nombre: 'Endodoncia (1 conducto)',          precio: 45000,  dur: 90  },
    { ci: 2, nombre: 'Endodoncia (2 conductos)',         precio: 60000,  dur: 120 },
    { ci: 2, nombre: 'Endodoncia (3 conductos)',         precio: 75000,  dur: 150 },
    // Cirugía
    { ci: 3, nombre: 'Extracción simple',                precio: 18000,  dur: 30 },
    { ci: 3, nombre: 'Extracción muela del juicio',      precio: 38000,  dur: 60 },
    { ci: 3, nombre: 'Cirugía periodontal',              precio: 55000,  dur: 90 },
    // Estética
    { ci: 4, nombre: 'Blanqueamiento dental',            precio: 45000,  dur: 60 },
    { ci: 4, nombre: 'Carilla de porcelana (por pieza)', precio: 95000,  dur: 90 },
    { ci: 4, nombre: 'Corona de porcelana',              precio: 85000,  dur: 90 },
    // Implantología
    { ci: 5, nombre: 'Implante dental (por unidad)',     precio: 260000, dur: 120 },
    { ci: 5, nombre: 'Corona sobre implante',            precio: 90000,  dur: 90  },
  ];
  const T = [];
  for (const t of tratDefs) {
    const [trat] = await Tratamiento.findOrCreate({
      where: { nombre: t.nombre },
      defaults: { categoria_id: cats[t.ci].id, nombre: t.nombre, precio: t.precio, duracion_minutos: t.dur, activo: true }
    });
    T.push(trat);
  }
  console.log(`  ✓ ${cats.length} categorías + ${T.length} tratamientos\n`);

  // ── PACIENTES (20) ─────────────────────────────────────────────────────────
  console.log('→ Creando pacientes...');
  const pacDefs = [
    { nombre: 'Valentina', apellido: 'Gómez',     dni: '30145678', fnac: '1990-03-15', gen: 'femenino',   tel: '11-6789-0123', email: 'vgomez@gmail.com',       os: 'OSDE',          na: 'OS-123456', alg: 'Penicilina' },
    { nombre: 'Rodrigo',   apellido: 'Martínez',  dni: '28963214', fnac: '1985-07-22', gen: 'masculino',  tel: '11-7890-1234', email: 'rmartinez@gmail.com',    os: 'Swiss Medical', na: 'SM-234567' },
    { nombre: 'Luciana',   apellido: 'López',     dni: '35214789', fnac: '1995-11-08', gen: 'femenino',   tel: '11-8901-2345', email: 'llopez@hotmail.com' },
    { nombre: 'Matías',    apellido: 'González',  dni: '32654789', fnac: '1988-05-30', gen: 'masculino',  tel: '11-9012-3456', os: 'IOMA', na: 'IO-345678', ant: 'Hipertensión arterial', med: 'Enalapril 10mg' },
    { nombre: 'Camila',    apellido: 'Fernández', dni: '38745632', fnac: '1998-02-14', gen: 'femenino',   tel: '11-0123-4567', email: 'cfernandez@gmail.com',   os: 'Galeno' },
    { nombre: 'Facundo',   apellido: 'Torres',    dni: '29874125', fnac: '1982-09-05', gen: 'masculino',  tel: '11-1234-5678', email: 'ftorres@gmail.com',       alg: 'Ibuprofeno' },
    { nombre: 'Sofía',     apellido: 'Díaz',      dni: '40125698', fnac: '2001-06-18', gen: 'femenino',   tel: '11-2345-6780', email: 'sdiaz@gmail.com',         os: 'OSDE', na: 'OS-456789' },
    { nombre: 'Nicolás',   apellido: 'Ruiz',      dni: '27456321', fnac: '1978-12-03', gen: 'masculino',  tel: '11-3456-7891', ant: 'Diabetes tipo 2', med: 'Metformina 500mg' },
    { nombre: 'Florencia', apellido: 'Sánchez',   dni: '33698741', fnac: '1992-08-25', gen: 'femenino',   tel: '11-4567-8902', email: 'fsanchez@hotmail.com',   os: 'Swiss Medical' },
    { nombre: 'Sebastián', apellido: 'Pérez',     dni: '31254789', fnac: '1987-04-10', gen: 'masculino',  tel: '11-5678-9013', email: 'sperez@gmail.com',        os: 'IOMA' },
    { nombre: 'Agustina',  apellido: 'Ramírez',   dni: '39874523', fnac: '2000-01-28', gen: 'femenino',   tel: '11-6789-0124' },
    { nombre: 'Diego',     apellido: 'Morales',   dni: '26547896', fnac: '1975-10-17', gen: 'masculino',  tel: '11-7890-1235', email: 'dmorales@gmail.com',      os: 'Galeno', ant: 'Asma' },
    { nombre: 'Martina',   apellido: 'Ortiz',     dni: '37856412', fnac: '1997-07-04', gen: 'femenino',   tel: '11-8901-2346', email: 'mortiz@gmail.com',        os: 'OSDE', na: 'OS-567890' },
    { nombre: 'Pablo',     apellido: 'Herrera',   dni: '24785632', fnac: '1971-03-22', gen: 'masculino',  tel: '11-9012-3457', alg: 'Amoxicilina, Penicilina' },
    { nombre: 'Julieta',   apellido: 'Castro',    dni: '36541298', fnac: '1996-11-11', gen: 'femenino',   tel: '11-0123-4568', email: 'jcastro@gmail.com',       os: 'Swiss Medical' },
    { nombre: 'Tomás',     apellido: 'Vargas',    dni: '34789512', fnac: '1993-05-07', gen: 'masculino',  tel: '11-1234-5679', email: 'tvargas@hotmail.com' },
    { nombre: 'Micaela',   apellido: 'Acosta',    dni: '41236987', fnac: '2003-09-30', gen: 'femenino',   tel: '11-2345-6781', os: 'IOMA' },
    { nombre: 'Leandro',   apellido: 'Silva',     dni: '30789654', fnac: '1989-06-15', gen: 'masculino',  tel: '11-3456-7892', email: 'lsilva@gmail.com',        os: 'OSDE', na: 'OS-678901', ant: 'Coagulopatía leve' },
    { nombre: 'Carolina',  apellido: 'Medina',    dni: '28654123', fnac: '1984-02-08', gen: 'femenino',   tel: '11-4567-8903', email: 'cmedina@gmail.com',       os: 'Galeno' },
    { nombre: 'Ignacio',   apellido: 'Benítez',   dni: '43125478', fnac: '2005-12-20', gen: 'masculino',  tel: '11-5678-9014', notas: 'Paciente menor de edad, acompañar con tutor' },
  ];
  const P = [];
  for (const p of pacDefs) {
    const [pac] = await Paciente.findOrCreate({
      where: { dni: p.dni },
      defaults: {
        nombre: p.nombre, apellido: p.apellido, dni: p.dni,
        fecha_nacimiento: p.fnac, genero: p.gen, telefono: p.tel,
        email: p.email || null, direccion: p.dir || null,
        obra_social: p.os || null, numero_afiliado: p.na || null,
        antecedentes_medicos: p.ant || null, alergias: p.alg || null,
        medicamentos: p.med || null, notas: p.notas || null, activo: true
      }
    });
    P.push(pac);
  }
  console.log(`  ✓ ${P.length} pacientes\n`);

  // ── CITAS (20) ────────────────────────────────────────────────────────────
  console.log('→ Creando citas...');
  const citaDefs = [
    { pi: 0,  di: doc1, fecha: '2026-01-08', hi: '09:00:00', hf: '09:30:00', motivo: 'Consulta inicial y diagnóstico',          estado: 'completada' },
    { pi: 1,  di: doc1, fecha: '2026-01-15', hi: '10:00:00', hf: '10:45:00', motivo: 'Limpieza dental',                         estado: 'completada' },
    { pi: 2,  di: doc2, fecha: '2026-01-22', hi: '11:00:00', hf: '12:30:00', motivo: 'Colocación de brackets cerámicos',        estado: 'completada' },
    { pi: 3,  di: doc1, fecha: '2026-02-05', hi: '09:30:00', hf: '10:30:00', motivo: 'Obturaciones piezas 16 y 17',             estado: 'completada' },
    { pi: 4,  di: doc3, fecha: '2026-02-12', hi: '14:00:00', hf: '15:00:00', motivo: 'Extracción muelas del juicio 18 y 28',    estado: 'completada' },
    { pi: 5,  di: doc1, fecha: '2026-02-18', hi: '15:00:00', hf: '16:30:00', motivo: 'Endodoncia pieza 26',                     estado: 'completada' },
    { pi: 6,  di: doc2, fecha: '2026-02-25', hi: '10:00:00', hf: '11:00:00', motivo: 'Control ortodoncia',                      estado: 'completada' },
    { pi: 7,  di: doc3, fecha: '2026-03-04', hi: '09:00:00', hf: '11:00:00', motivo: 'Consulta implante pieza 36',              estado: 'completada' },
    { pi: 8,  di: doc1, fecha: '2026-03-11', hi: '11:30:00', hf: '12:30:00', motivo: 'Blanqueamiento dental',                   estado: 'completada' },
    { pi: 9,  di: doc2, fecha: '2026-03-18', hi: '16:00:00', hf: '17:00:00', motivo: 'Consulta ortodoncia + radiografía',       estado: 'completada' },
    { pi: 10, di: doc1, fecha: '2026-03-20', hi: '09:00:00', hf: '09:30:00', motivo: 'Control post-tratamiento',                estado: 'no_asistio' },
    { pi: 11, di: doc3, fecha: '2026-03-25', hi: '10:30:00', hf: '12:30:00', motivo: 'Colocación implantes 36 y 46',            estado: 'completada' },
    { pi: 12, di: doc1, fecha: '2026-04-01', hi: '14:30:00', hf: '15:15:00', motivo: 'Limpieza y fluoración',                   estado: 'completada' },
    { pi: 13, di: doc2, fecha: '2026-04-03', hi: '11:00:00', hf: '12:00:00', motivo: 'Brackets - primera consulta',             estado: 'cancelada', notas: 'Paciente canceló por viaje' },
    { pi: 14, di: doc1, fecha: '2026-04-08', hi: '09:00:00', hf: '10:30:00', motivo: 'Endodoncia y preparación corona pieza 37', estado: 'completada' },
    { pi: 15, di: doc3, fecha: '2026-04-15', hi: '14:00:00', hf: '16:00:00', motivo: 'Colocación implante pieza 15',            estado: 'completada' },
    { pi: 16, di: doc1, fecha: '2026-04-18', hi: '09:00:00', hf: '09:30:00', motivo: 'Consulta primera vez',                    estado: 'confirmada' },
    { pi: 17, di: doc2, fecha: '2026-04-18', hi: '10:00:00', hf: '11:30:00', motivo: 'Colocación de brackets cerámicos',       estado: 'programada' },
    { pi: 18, di: doc1, fecha: '2026-04-22', hi: '15:00:00', hf: '16:00:00', motivo: 'Limpieza profunda (curetaje)',            estado: 'programada' },
    { pi: 19, di: doc3, fecha: '2026-04-25', hi: '11:00:00', hf: '13:00:00', motivo: 'Consulta implante y plan de tratamiento', estado: 'programada' },
  ];
  const C = [];
  for (const c of citaDefs) {
    const [cita] = await Cita.findOrCreate({
      where: { paciente_id: P[c.pi].id, fecha: c.fecha, hora_inicio: c.hi },
      defaults: { paciente_id: P[c.pi].id, doctor_id: c.di.id, fecha: c.fecha, hora_inicio: c.hi, hora_fin: c.hf, motivo: c.motivo, estado: c.estado, notas: c.notas || null }
    });
    C.push(cita);
  }
  console.log(`  ✓ ${C.length} citas\n`);

  // ── PRESUPUESTOS (20) + DETALLES ───────────────────────────────────────────
  console.log('→ Creando presupuestos y detalles...');
  // [pacIdx, docRef, estado, descuento, [[tratIdx, pieza, estadoDet], ...]]
  const presDefs = [
    [0,  doc1, 'finalizado', 5000,   [[0,null,'completado'],[2,16,'completado'],[2,17,'completado']]],
    [1,  doc1, 'finalizado', 0,      [[1,null,'completado'],[4,null,'completado']]],
    [2,  doc2, 'en_curso',   15000,  [[7,null,'en_curso']]],
    [3,  doc1, 'finalizado', 0,      [[3,16,'completado'],[3,17,'completado']]],
    [4,  doc3, 'finalizado', 0,      [[13,18,'completado'],[13,28,'completado']]],
    [5,  doc1, 'finalizado', 0,      [[10,26,'completado']]],
    [6,  doc2, 'en_curso',   20000,  [[6,null,'en_curso']]],
    [7,  doc3, 'aceptado',   30000,  [[18,36,'pendiente'],[19,36,'pendiente']]],
    [8,  doc1, 'finalizado', 0,      [[15,null,'completado']]],
    [9,  doc2, 'aceptado',   0,      [[8,null,'pendiente'],[5,null,'pendiente']]],
    [10, doc1, 'pendiente',  0,      [[1,null,'pendiente'],[2,14,'pendiente']]],
    [11, doc3, 'finalizado', 50000,  [[18,36,'completado'],[18,46,'completado'],[19,46,'completado']]],
    [12, doc1, 'finalizado', 0,      [[1,null,'completado'],[4,null,'completado']]],
    [13, doc2, 'rechazado',  0,      [[6,null,'pendiente']]],
    [14, doc1, 'finalizado', 0,      [[9,37,'completado'],[17,37,'completado']]],
    [15, doc3, 'en_curso',   25000,  [[18,15,'en_curso'],[19,15,'pendiente']]],
    [16, doc1, 'pendiente',  0,      [[0,null,'pendiente']]],
    [17, doc2, 'aceptado',   15000,  [[7,null,'pendiente']]],
    [18, doc1, 'pendiente',  0,      [[1,null,'pendiente']]],
    [19, doc3, 'pendiente',  0,      [[0,null,'pendiente'],[4,null,'pendiente']]],
  ];

  const PRES = [];
  for (const [pi, doc, estado, desc, dets] of presDefs) {
    const total = dets.reduce((s, [ti]) => s + Number(T[ti].precio), 0) - desc;
    const existente = await Presupuesto.findOne({ where: { paciente_id: P[pi].id, doctor_id: doc.id } });
    if (existente) { PRES.push(existente); continue; }
    const pres = await Presupuesto.create({ paciente_id: P[pi].id, doctor_id: doc.id, estado, descuento: desc, total });
    for (const [ti, pieza, detEstado] of dets) {
      await DetallePresupuesto.create({ presupuesto_id: pres.id, tratamiento_id: T[ti].id, pieza_dental: pieza, precio: T[ti].precio, estado: detEstado });
    }
    PRES.push(pres);
  }
  console.log(`  ✓ ${PRES.length} presupuestos con detalles\n`);

  // ── PAGOS (20) ─────────────────────────────────────────────────────────────
  // Distribuidos en Enero–Abril 2026 para mostrar gráficos de ingresos
  console.log('→ Creando pagos...');
  const pagoDefs = [
    // Enero
    [0,  PRES[0],  38000,  'efectivo',         '2026-01-10', 'REC-0001'],
    [1,  PRES[1],  20000,  'transferencia',    '2026-01-16', 'REC-0002'],
    [2,  PRES[2],  100000, 'tarjeta_credito',  '2026-01-23', 'REC-0003'],
    // Febrero
    [3,  PRES[3],  44000,  'efectivo',         '2026-02-06', 'REC-0004'],
    [4,  PRES[4],  76000,  'tarjeta_debito',   '2026-02-13', 'REC-0005'],
    [5,  PRES[5],  60000,  'transferencia',    '2026-02-19', 'REC-0006'],
    [6,  PRES[6],  130000, 'tarjeta_credito',  '2026-02-26', 'REC-0007'],
    // Marzo
    [7,  PRES[7],  200000, 'transferencia',    '2026-03-05', 'REC-0008'],
    [8,  PRES[8],  45000,  'efectivo',         '2026-03-12', 'REC-0009'],
    [9,  PRES[9],  18000,  'efectivo',         '2026-03-19', 'REC-0010'],
    [11, PRES[11], 300000, 'transferencia',    '2026-03-26', 'REC-0011'],
    // Abril
    [12, PRES[12], 20000,  'efectivo',         '2026-04-02', 'REC-0012'],
    [14, PRES[14], 130000, 'tarjeta_credito',  '2026-04-09', 'REC-0013'],
    [15, PRES[15], 175000, 'transferencia',    '2026-04-16', 'REC-0014'],
    // Pagos parciales (genera deuda pendiente visible en reportes)
    [2,  PRES[2],  115000, 'tarjeta_debito',   '2026-03-15', 'REC-0015'],
    [6,  PRES[6],  130000, 'tarjeta_credito',  '2026-04-05', 'REC-0016'],
    [7,  PRES[7],  150000, 'efectivo',         '2026-04-10', 'REC-0017'],
    [17, PRES[17], 100000, 'transferencia',    '2026-04-17', 'REC-0018'],
    [0,  null,     5000,   'efectivo',         '2026-04-18', 'REC-0019', 'Pago consulta control'],
    [10, PRES[10], 20000,  'tarjeta_debito',   '2026-04-18', 'REC-0020'],
  ];

  let pagosCreados = 0;
  for (const [pi, pres, monto, metodo, fecha, recibo, notas] of pagoDefs) {
    const existe = await Pago.findOne({ where: { numero_recibo: recibo } });
    if (!existe) {
      await Pago.create({ paciente_id: P[pi].id, presupuesto_id: pres?.id || null, monto, metodo_pago: metodo, fecha, numero_recibo: recibo, notas: notas || null });
      pagosCreados++;
    }
  }
  console.log(`  ✓ ${pagosCreados} pagos (distribuidos ene–abr 2026)\n`);

  // ── ODONTOGRAMA (20) ──────────────────────────────────────────────────────
  console.log('→ Creando odontograma...');
  const odoDefs = [
    [0,  doc1, 16, 'oclusal',    'obturacion', '2026-01-08', 'Obturación de resina previa'],
    [0,  doc1, 17, 'oclusal',    'caries',     '2026-01-08', 'Caries incipiente'],
    [1,  doc1, 36, 'completa',   'obturacion', '2026-01-15', 'Obturación de resina compuesta'],
    [3,  doc1, 16, 'oclusal',    'obturacion', '2026-02-05', 'Obturación compuesta realizada'],
    [4,  doc3, 18, 'completa',   'ausente',    '2026-02-12', 'Extracción quirúrgica realizada'],
    [4,  doc3, 28, 'completa',   'ausente',    '2026-02-12', 'Extracción quirúrgica realizada'],
    [5,  doc1, 26, 'completa',   'endodoncia', '2026-02-18', 'Endodoncia de 2 conductos completada'],
    [5,  doc1, 26, 'completa',   'corona',     '2026-03-01', 'Corona provisional colocada'],
    [7,  doc3, 36, 'completa',   'implante',   '2026-03-04', 'Implante en proceso de oseointegración'],
    [8,  doc1, 11, 'vestibular', 'sano',       '2026-03-11', 'Post-blanqueamiento, diente sano'],
    [11, doc3, 36, 'completa',   'implante',   '2026-03-25', 'Implante colocado'],
    [11, doc3, 46, 'completa',   'implante',   '2026-03-25', 'Implante colocado'],
    [14, doc1, 37, 'completa',   'endodoncia', '2026-04-08', 'Endodoncia completada'],
    [14, doc1, 37, 'completa',   'corona',     '2026-04-08', 'Preparación para corona definitiva'],
    [15, doc3, 15, 'completa',   'implante',   '2026-04-15', 'Implante colocado, oseointegración pendiente'],
    [6,  doc2, 11, 'vestibular', 'sano',       '2026-02-25', 'Alineación con brackets en progreso'],
    [2,  doc2, 13, 'vestibular', 'sano',       '2026-01-22', 'Brackets colocados, seguimiento'],
    [9,  doc2, 22, 'vestibular', 'sano',       '2026-03-18', 'Evaluación para ortodoncia'],
    [17, doc2, 21, 'vestibular', 'sano',       '2026-04-18', 'Evaluación pre-ortodoncia'],
    [19, doc1, 55, 'oclusal',    'caries',     '2026-04-18', 'Caries en diente temporal, derivación odontopediatría'],
  ];
  let odoCreados = 0;
  for (const [pi, doc, pieza, cara, estado, fecha, obs] of odoDefs) {
    const existe = await Odontograma.findOne({ where: { paciente_id: P[pi].id, pieza_dental: pieza, fecha } });
    if (!existe) { await Odontograma.create({ paciente_id: P[pi].id, doctor_id: doc.id, pieza_dental: pieza, cara, estado, fecha, observacion: obs }); odoCreados++; }
  }
  console.log(`  ✓ ${odoCreados} registros de odontograma\n`);

  // ── HISTORIA CLÍNICA (20) ─────────────────────────────────────────────────
  console.log('→ Creando historias clínicas...');
  const histDefs = [
    { pi:0,  doc:doc1, ci:0,  fecha:'2026-01-08', diag:'Caries activas en piezas 16 y 17',                                    trat:'Obturación con resina compuesta en 16 y 17', piezas:'16,17', receta:'Ibuprofeno 400mg c/8hs por 3 días si dolor',                                    prox:'Control en 6 meses' },
    { pi:1,  doc:doc1, ci:1,  fecha:'2026-01-15', diag:'Acumulación moderada de sarro y placa',                               trat:'Profilaxis ultrasónica y fluoración',         piezas:'Arcada completa',                                                                    prox:'Profilaxis en 6 meses' },
    { pi:2,  doc:doc2, ci:2,  fecha:'2026-01-22', diag:'Maloclusión clase II, apiñamiento moderado',                          trat:'Colocación de brackets cerámicos',             piezas:'Arcada completa superior e inferior', notas:'Paciente motivada, excelente higiene oral' },
    { pi:3,  doc:doc1, ci:3,  fecha:'2026-02-05', diag:'Caries profundas con compromiso dentinario en 16 y 17',               trat:'Obturaciones compuestas en resina',            piezas:'16,17', receta:'Amoxicilina 500mg c/8hs 7 días; Ketorolac 10mg c/8hs 3 días' },
    { pi:4,  doc:doc3, ci:4,  fecha:'2026-02-12', diag:'Terceros molares 18 y 28 semierupcionados, pericoronaritis recurrente', trat:'Extracción quirúrgica piezas 18 y 28',        piezas:'18,28', receta:'Amoxicilina 500mg c/8hs 7d; Ibuprofeno 600mg c/8hs 5d; Dexametasona 4mg c/12hs 3d', prox:'Control post-op en 7 días' },
    { pi:5,  doc:doc1, ci:5,  fecha:'2026-02-18', diag:'Pulpitis irreversible pieza 26, percusión positiva',                  trat:'Endodoncia bicanal, limpieza y conformación', piezas:'26',   receta:'Ibuprofeno 600mg c/8hs 3 días',                                              prox:'Colocación corona definitiva en 15 días' },
    { pi:6,  doc:doc2, ci:6,  fecha:'2026-02-25', diag:'Tratamiento ortodóntico en progreso, buena alineación',               trat:'Activación de arcos, ajuste de torques',       notas:'Sin complicaciones, paciente adherente' },
    { pi:7,  doc:doc3, ci:7,  fecha:'2026-03-04', diag:'Edentulismo parcial zona posterior inferior, hueso adecuado',         trat:'Planificación implante pieza 36, toma de CBCT', notas:'Densidad ósea favorable, apto para implante estándar 4x10mm' },
    { pi:8,  doc:doc1, ci:8,  fecha:'2026-03-11', diag:'Tinción extrínseca severa por café y tabaco',                        trat:'Blanqueamiento con peróxido H2O2 35%, 3 aplicaciones', piezas:'Arcada superior', receta:'Gel desensibilizante FluoroCare 2x/día por 2 semanas', prox:'Evaluación resultado en 2 semanas' },
    { pi:9,  doc:doc2, ci:9,  fecha:'2026-03-18', diag:'Apiñamiento dentario moderado, relación molar clase I',               trat:'Evaluación completa, RX panorámica, modelos estudio', notas:'Plan de tratamiento: brackets metálicos 18 meses aprox.' },
    { pi:11, doc:doc3, ci:11, fecha:'2026-03-25', diag:'Edentulismo piezas 36 y 46 por extracciones previas',                 trat:'Colocación implantes Straumann 4.1x10mm en 36 y 46', piezas:'36,46', receta:'Amoxicilina 500mg c/8hs 7d; Ibuprofeno 400mg c/8hs 5d', prox:'Control oseointegración a los 3 meses' },
    { pi:12, doc:doc1, ci:12, fecha:'2026-04-01', diag:'Sin patología activa, acumulación leve de sarro',                     trat:'Profilaxis, fluoración, instrucción de higiene oral',  piezas:'Arcada completa', prox:'Profilaxis en 6 meses' },
    { pi:14, doc:doc1, ci:14, fecha:'2026-04-08', diag:'Pulpitis pieza 37, caries profunda con compromiso pulpar',            trat:'Endodoncia monocanal y preparación para corona',       piezas:'37', receta:'Ibuprofeno 600mg c/8hs 3 días', prox:'Cementado corona en 10 días' },
    { pi:15, doc:doc3, ci:15, fecha:'2026-04-15', diag:'Ausencia pieza 15 con atrofia ósea leve',                             trat:'Colocación implante 3.3x10mm, sutura reabsorbible 4-0', piezas:'15', receta:'Amoxicilina 875mg c/12hs 7d; Ibuprofeno 600mg c/8hs 5d', prox:'Retiro sutura en 7 días; control oseointegración 3 meses' },
    { pi:16, doc:doc1, ci:16, fecha:'2026-04-18', diag:'Primera consulta: múltiples caries incipientes, gingivitis leve',     trat:'Diagnóstico completo, RX periapical, plan de tratamiento', receta:'Flúor tópico (Prevident)', prox:'Inicio tratamiento en 1 semana' },
    { pi:17, doc:doc2, ci:17, fecha:'2026-04-18', diag:'Apiñamiento severo con mordida cruzada anterior y posterior',         trat:'Modelos de estudio, fotografías clínicas, planificación', notas:'Se recomienda extracción bicúspides para crear espacio. Presupuesto presentado' },
    { pi:13, doc:doc2, ci:13, fecha:'2026-04-03', diag:'Maloclusión clase I con apiñamiento leve',                            trat:'Consulta y plan de tratamiento ortodóntico',             notas:'Paciente posterga tratamiento por viaje al exterior por 6 meses' },
    { pi:10, doc:doc1,        fecha:'2026-04-12', diag:'Revisión de rutina, sin patología activa',                             trat:'Examen clínico general',                               prox:'Profilaxis en 3 meses' },
    { pi:18, doc:doc1,        fecha:'2026-04-08', diag:'Acumulación significativa de sarro subgingival',                       trat:'Indicación de curetaje (limpieza profunda)',             notas:'Se agenda curetaje para el 22/04', prox:'Curetaje 22/04/2026' },
    { pi:19, doc:doc1,        fecha:'2026-04-18', diag:'Caries en pieza temporal 55, sin afectación pulpar',                  trat:'Diagnóstico, derivación interna a odontopediatría',     receta:'Enjuague fluorado 0.05% diario' },
  ];
  let histCreadas = 0;
  for (const h of histDefs) {
    const existe = await HistoriaClinica.findOne({ where: { paciente_id: P[h.pi].id, fecha: h.fecha, doctor_id: h.doc.id } });
    if (!existe) {
      await HistoriaClinica.create({
        paciente_id: P[h.pi].id, doctor_id: h.doc.id, cita_id: h.ci !== undefined ? C[h.ci]?.id || null : null,
        fecha: h.fecha, diagnostico: h.diag, tratamiento_realizado: h.trat, piezas_tratadas: h.piezas || null,
        receta: h.receta || null, proxima_visita: h.prox || null, notas: h.notas || null
      });
      histCreadas++;
    }
  }
  console.log(`  ✓ ${histCreadas} historias clínicas\n`);

  // ── CONSENTIMIENTOS (20) ──────────────────────────────────────────────────
  console.log('→ Creando consentimientos...');
  const contenido = (tipo, nomPac, nomDoc) =>
    `Yo, ${nomPac}, declaro haber sido informado/a por el/la Dr./Dra. ${nomDoc} sobre el procedimiento de ${tipo}, incluyendo sus riesgos, beneficios y alternativas terapéuticas. Habiendo comprendido la información suministrada, otorgo mi consentimiento libre e informado para la realización del procedimiento mencionado.`;

  const consDefs = [
    [0,  doc1, 'Procedimiento general', true,  '2026-01-08T08:45:00'],
    [1,  doc1, 'Procedimiento general', true,  '2026-01-15T09:50:00'],
    [2,  doc2, 'Ortodoncia',            true,  '2026-01-22T10:45:00'],
    [3,  doc1, 'Procedimiento general', true,  '2026-02-05T09:25:00'],
    [4,  doc3, 'Extracción dental',     true,  '2026-02-12T09:15:00'],
    [5,  doc1, 'Endodoncia',            true,  '2026-02-18T08:50:00'],
    [6,  doc2, 'Ortodoncia',            true,  '2026-02-25T09:30:00'],
    [7,  doc3, 'Implante dental',       true,  '2026-03-04T09:20:00'],
    [8,  doc1, 'Blanqueamiento dental', true,  '2026-03-11T11:10:00'],
    [9,  doc2, 'Ortodoncia',            false, null],
    [11, doc3, 'Implante dental',       true,  '2026-03-25T10:00:00'],
    [12, doc1, 'Procedimiento general', true,  '2026-04-01T14:20:00'],
    [13, doc2, 'Ortodoncia',            false, null],
    [14, doc1, 'Endodoncia',            true,  '2026-04-08T09:05:00'],
    [15, doc3, 'Implante dental',       true,  '2026-04-15T13:50:00'],
    [16, doc1, 'Procedimiento general', false, null],
    [17, doc2, 'Ortodoncia',            false, null],
    [18, doc1, 'Procedimiento general', false, null],
    [19, doc3, 'Procedimiento general', false, null],
    [10, doc1, 'Procedimiento general', false, null],
  ];
  let consCreados = 0;
  for (const [pi, doc, tipo, firmado, fechaFirma] of consDefs) {
    const existe = await Consentimiento.findOne({ where: { paciente_id: P[pi].id, tipo, doctor_id: doc.id } });
    if (!existe) {
      await Consentimiento.create({
        paciente_id: P[pi].id, doctor_id: doc.id, tipo,
        contenido: contenido(tipo, `${P[pi].nombre} ${P[pi].apellido}`, `${doc.nombre} ${doc.apellido}`),
        firmado, fecha_firma: firmado ? new Date(fechaFirma) : null,
        ip_firma: firmado ? `192.168.1.${10 + pi}` : null
      });
      consCreados++;
    }
  }
  console.log(`  ✓ ${consCreados} consentimientos\n`);

  // ── LOG DE ACTIVIDAD (20) ─────────────────────────────────────────────────
  console.log('→ Creando logs de actividad...');
  const logCount = await LogActividad.count();
  if (logCount < 5) {
    const admin = await Usuario.findOne({ where: { rol: 'administrador' } });
    const logDefs = [
      ...P.slice(0, 10).map(p => ({ usuario_id: admin?.id, accion: 'crear', entidad: 'paciente',     entidad_id: p.id, detalle: `Paciente ${p.nombre} ${p.apellido} registrado`, ip: '192.168.1.1' })),
      ...C.slice(0, 5).map(c =>  ({ usuario_id: doc1.id,   accion: 'crear', entidad: 'cita',         entidad_id: c.id, detalle: `Cita programada para ${c.fecha}`,               ip: '192.168.1.2' })),
      ...PRES.slice(0, 5).map(p => ({ usuario_id: doc1.id, accion: 'crear', entidad: 'presupuesto',  entidad_id: p.id, detalle: `Presupuesto #${p.id} creado`,                   ip: '192.168.1.2' })),
    ];
    await LogActividad.bulkCreate(logDefs.slice(0, 20));
    console.log(`  ✓ 20 logs de actividad\n`);
  } else {
    console.log(`  ℹ Logs ya existentes (${logCount}), omitidos\n`);
  }

  // ── RESUMEN ───────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════');
  console.log('🦷  Seed completado exitosamente');
  console.log('───────────────────────────────────────────────────');
  console.log(`  Pacientes:        ${P.length}`);
  console.log(`  Citas:            ${C.length}`);
  console.log(`  Tratamientos:     ${T.length}`);
  console.log(`  Presupuestos:     ${PRES.length}`);
  console.log(`  Pagos:            20`);
  console.log(`  Odontograma:      ${odoCreados}`);
  console.log(`  Historias clínicas: ${histCreadas}`);
  console.log(`  Consentimientos:  ${consCreados}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('\n  Credenciales nuevos usuarios:');
  console.log('  Email: carlos.mendoza@clinica.com  / clinica123 (doctor)');
  console.log('  Email: ana.rodriguez@clinica.com   / clinica123 (doctor)');
  console.log('  Email: lucas.fernandez@clinica.com / clinica123 (doctor)');
  console.log('  Email: maria.garcia@clinica.com    / clinica123 (recepcionista)\n');

  await sequelize.close();
}

seed().catch(err => {
  console.error('\n✗ Error en seed:', err.message);
  console.error(err);
  process.exit(1);
});

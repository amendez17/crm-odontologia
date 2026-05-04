require('dotenv').config();
const { sequelize, Usuario, CategoriaTratamiento, Tratamiento } = require('./models');

const categorias = [
  { nombre: 'Diagnóstico', descripcion: 'Estudios y evaluaciones iniciales' },
  { nombre: 'Prevención', descripcion: 'Tratamientos preventivos y de higiene' },
  { nombre: 'Operatoria Dental', descripcion: 'Restauraciones y obturaciones' },
  { nombre: 'Endodoncia', descripcion: 'Tratamientos de conducto' },
  { nombre: 'Periodoncia', descripcion: 'Tratamientos de encías y tejidos de soporte' },
  { nombre: 'Cirugía', descripcion: 'Extracciones y procedimientos quirúrgicos' },
  { nombre: 'Prótesis', descripcion: 'Prótesis fijas y removibles' },
  { nombre: 'Ortodoncia', descripcion: 'Corrección de posición dental' },
  { nombre: 'Implantología', descripcion: 'Implantes dentales' },
  { nombre: 'Estética Dental', descripcion: 'Blanqueamiento y carillas' },
  { nombre: 'Odontopediatría', descripcion: 'Tratamientos para niños' },
  { nombre: 'Radiología', descripcion: 'Estudios radiográficos' }
];

const tratamientosPorCategoria = {
  'Diagnóstico': [
    { nombre: 'Consulta de diagnóstico', precio: 5000, duracion_minutos: 30 },
    { nombre: 'Plan de tratamiento integral', precio: 3000, duracion_minutos: 45 },
    { nombre: 'Consulta de urgencia', precio: 8000, duracion_minutos: 30 },
  ],
  'Prevención': [
    { nombre: 'Limpieza dental (profilaxis)', precio: 12000, duracion_minutos: 40 },
    { nombre: 'Aplicación de flúor', precio: 5000, duracion_minutos: 15 },
    { nombre: 'Sellador de fosas y fisuras (por pieza)', precio: 6000, duracion_minutos: 20 },
    { nombre: 'Destartraje (remoción de sarro)', precio: 15000, duracion_minutos: 45 },
  ],
  'Operatoria Dental': [
    { nombre: 'Obturación simple (resina)', precio: 15000, duracion_minutos: 30 },
    { nombre: 'Obturación compuesta (resina)', precio: 20000, duracion_minutos: 45 },
    { nombre: 'Obturación compleja (resina)', precio: 25000, duracion_minutos: 60 },
    { nombre: 'Incrustación de porcelana', precio: 45000, duracion_minutos: 60 },
    { nombre: 'Reconstrucción con perno', precio: 35000, duracion_minutos: 60 },
  ],
  'Endodoncia': [
    { nombre: 'Tratamiento de conducto (unirradicular)', precio: 35000, duracion_minutos: 60 },
    { nombre: 'Tratamiento de conducto (birradicular)', precio: 45000, duracion_minutos: 90 },
    { nombre: 'Tratamiento de conducto (multirradicular)', precio: 55000, duracion_minutos: 90 },
    { nombre: 'Retratamiento de conducto', precio: 50000, duracion_minutos: 90 },
    { nombre: 'Pulpotomía', precio: 18000, duracion_minutos: 45 },
  ],
  'Periodoncia': [
    { nombre: 'Raspaje y alisado radicular (por cuadrante)', precio: 18000, duracion_minutos: 45 },
    { nombre: 'Cirugía periodontal (por cuadrante)', precio: 40000, duracion_minutos: 90 },
    { nombre: 'Injerto de encía', precio: 55000, duracion_minutos: 60 },
    { nombre: 'Alargamiento de corona clínica', precio: 35000, duracion_minutos: 60 },
  ],
  'Cirugía': [
    { nombre: 'Extracción simple', precio: 12000, duracion_minutos: 30 },
    { nombre: 'Extracción compleja', precio: 20000, duracion_minutos: 45 },
    { nombre: 'Extracción de tercer molar (muela de juicio)', precio: 35000, duracion_minutos: 60 },
    { nombre: 'Extracción de tercer molar incluido', precio: 50000, duracion_minutos: 90 },
    { nombre: 'Biopsia de tejidos blandos', precio: 25000, duracion_minutos: 30 },
    { nombre: 'Frenectomía', precio: 20000, duracion_minutos: 30 },
  ],
  'Prótesis': [
    { nombre: 'Corona de porcelana', precio: 65000, duracion_minutos: 60 },
    { nombre: 'Corona de zirconio', precio: 85000, duracion_minutos: 60 },
    { nombre: 'Corona provisoria', precio: 15000, duracion_minutos: 30 },
    { nombre: 'Puente fijo (por pieza)', precio: 65000, duracion_minutos: 60 },
    { nombre: 'Prótesis parcial removible', precio: 80000, duracion_minutos: 60 },
    { nombre: 'Prótesis completa (por arcada)', precio: 120000, duracion_minutos: 90 },
    { nombre: 'Reparación de prótesis', precio: 18000, duracion_minutos: 30 },
    { nombre: 'Rebasado de prótesis', precio: 25000, duracion_minutos: 45 },
  ],
  'Ortodoncia': [
    { nombre: 'Estudio de ortodoncia completo', precio: 25000, duracion_minutos: 60 },
    { nombre: 'Brackets metálicos (tratamiento completo)', precio: 350000, duracion_minutos: 60 },
    { nombre: 'Brackets estéticos (tratamiento completo)', precio: 450000, duracion_minutos: 60 },
    { nombre: 'Alineadores transparentes', precio: 550000, duracion_minutos: 45 },
    { nombre: 'Control de ortodoncia mensual', precio: 12000, duracion_minutos: 30 },
    { nombre: 'Contención fija', precio: 25000, duracion_minutos: 30 },
    { nombre: 'Placa de contención removible', precio: 30000, duracion_minutos: 30 },
  ],
  'Implantología': [
    { nombre: 'Implante dental (pieza)', precio: 250000, duracion_minutos: 90 },
    { nombre: 'Pilar protésico sobre implante', precio: 60000, duracion_minutos: 45 },
    { nombre: 'Corona sobre implante', precio: 85000, duracion_minutos: 60 },
    { nombre: 'Elevación de seno maxilar', precio: 180000, duracion_minutos: 120 },
    { nombre: 'Injerto óseo', precio: 120000, duracion_minutos: 90 },
    { nombre: 'Prótesis sobre implantes (arcada completa)', precio: 800000, duracion_minutos: 120 },
  ],
  'Estética Dental': [
    { nombre: 'Blanqueamiento en consultorio', precio: 45000, duracion_minutos: 60 },
    { nombre: 'Blanqueamiento con cubetas (domiciliario)', precio: 30000, duracion_minutos: 30 },
    { nombre: 'Carilla de porcelana (por pieza)', precio: 75000, duracion_minutos: 60 },
    { nombre: 'Carilla de resina (por pieza)', precio: 30000, duracion_minutos: 45 },
    { nombre: 'Diseño de sonrisa (diagnóstico)', precio: 20000, duracion_minutos: 60 },
  ],
  'Odontopediatría': [
    { nombre: 'Consulta pediátrica', precio: 5000, duracion_minutos: 30 },
    { nombre: 'Pulpotomía en diente temporal', precio: 15000, duracion_minutos: 40 },
    { nombre: 'Corona de acero (diente temporal)', precio: 18000, duracion_minutos: 30 },
    { nombre: 'Mantenedor de espacio', precio: 25000, duracion_minutos: 45 },
    { nombre: 'Obturación en diente temporal', precio: 10000, duracion_minutos: 30 },
  ],
  'Radiología': [
    { nombre: 'Radiografía periapical', precio: 3000, duracion_minutos: 10 },
    { nombre: 'Radiografía panorámica', precio: 8000, duracion_minutos: 15 },
    { nombre: 'Radiografía oclusal', precio: 4000, duracion_minutos: 10 },
    { nombre: 'Tomografía Cone Beam (CBCT)', precio: 25000, duracion_minutos: 20 },
    { nombre: 'Serie radiográfica completa', precio: 15000, duracion_minutos: 30 },
  ]
};

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conexión exitosa a MySQL.');

    await sequelize.sync({ alter: true });
    console.log('Tablas sincronizadas.');

    // Usuario admin
    const [admin] = await Usuario.findOrCreate({
      where: { email: 'admin@clinica.com' },
      defaults: {
        nombre: 'Admin', apellido: 'Sistema',
        email: 'admin@clinica.com', password: 'admin123',
        rol: 'administrador'
      }
    });
    console.log('Admin verificado.');

    // Doctores de ejemplo
    const doctoresData = [
      { nombre: 'Carlos', apellido: 'Rodríguez', email: 'carlos@clinica.com', password: 'doctor123', rol: 'doctor', especialidad: 'Odontología General' },
      { nombre: 'María', apellido: 'González', email: 'maria@clinica.com', password: 'doctor123', rol: 'doctor', especialidad: 'Ortodoncia' },
      { nombre: 'Andrés', apellido: 'López', email: 'andres@clinica.com', password: 'doctor123', rol: 'doctor', especialidad: 'Endodoncia' },
      { nombre: 'Laura', apellido: 'Martínez', email: 'laura@clinica.com', password: 'doctor123', rol: 'doctor', especialidad: 'Implantología' },
    ];

    for (const doc of doctoresData) {
      await Usuario.findOrCreate({ where: { email: doc.email }, defaults: doc });
    }
    console.log('Doctores creados.');

    // Recepcionista
    await Usuario.findOrCreate({
      where: { email: 'recepcion@clinica.com' },
      defaults: {
        nombre: 'Ana', apellido: 'Pérez',
        email: 'recepcion@clinica.com', password: 'recepcion123',
        rol: 'recepcionista'
      }
    });
    console.log('Recepcionista creada.');

    // Categorías y tratamientos
    for (const catData of categorias) {
      const [categoria] = await CategoriaTratamiento.findOrCreate({
        where: { nombre: catData.nombre },
        defaults: catData
      });

      const tratamientos = tratamientosPorCategoria[catData.nombre] || [];
      for (const tratData of tratamientos) {
        await Tratamiento.findOrCreate({
          where: { nombre: tratData.nombre },
          defaults: { ...tratData, categoria_id: categoria.id }
        });
      }
    }
    console.log('Catálogo de tratamientos cargado.');

    console.log('\n=== SEED COMPLETADO ===');
    console.log('Usuarios disponibles:');
    console.log('  Admin:         admin@clinica.com / admin123');
    console.log('  Dr. Rodríguez: carlos@clinica.com / doctor123');
    console.log('  Dra. González: maria@clinica.com / doctor123');
    console.log('  Dr. López:     andres@clinica.com / doctor123');
    console.log('  Dra. Martínez: laura@clinica.com / doctor123');
    console.log('  Recepción:     recepcion@clinica.com / recepcion123');

    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
}

seed();

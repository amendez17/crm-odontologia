-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 04-05-2026 a las 21:34:07
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `odontologia_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias_tratamiento`
--

CREATE TABLE `categorias_tratamiento` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categorias_tratamiento`
--

INSERT INTO `categorias_tratamiento` (`id`, `nombre`, `descripcion`, `createdAt`, `updatedAt`) VALUES
(1, 'Diagnóstico', 'Estudios y evaluaciones iniciales', '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(2, 'Prevención', 'Tratamientos preventivos y de higiene', '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(3, 'Operatoria Dental', 'Restauraciones y obturaciones', '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(4, 'Endodoncia', 'Tratamientos de conducto', '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(5, 'Periodoncia', 'Tratamientos de encías y tejidos de soporte', '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(6, 'Cirugía', 'Extracciones y procedimientos quirúrgicos', '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(7, 'Prótesis', 'Prótesis fijas y removibles', '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(8, 'Ortodoncia', 'Corrección de posición dental', '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(9, 'Implantología', 'Implantes dentales', '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(10, 'Estética Dental', 'Blanqueamiento y carillas', '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(11, 'Odontopediatría', 'Tratamientos para niños', '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(12, 'Radiología', 'Estudios radiográficos', '2026-04-10 06:42:09', '2026-04-10 06:42:09'),
(13, 'Odontología General', 'Consultas, limpiezas y tratamientos preventivos', '2026-04-18 07:01:53', '2026-04-18 07:01:53'),
(14, 'Cirugía Bucal', 'Extracciones y procedimientos quirúrgicos', '2026-04-18 07:01:53', '2026-04-18 07:01:53');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas`
--

CREATE TABLE `citas` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time DEFAULT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `estado` enum('programada','confirmada','en_curso','completada','cancelada','no_asistio') DEFAULT 'programada',
  `notas` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `citas`
--

INSERT INTO `citas` (`id`, `paciente_id`, `doctor_id`, `fecha`, `hora_inicio`, `hora_fin`, `motivo`, `estado`, `notas`, `createdAt`, `updatedAt`) VALUES
(1, 1, 21, '2026-04-30', '10:00:00', '11:00:00', 'Limpieza', 'completada', '\nDio anticipo', '2026-04-29 22:51:06', '2026-04-30 17:37:49'),
(2, 2, 21, '2026-04-30', '10:00:00', '11:00:00', 'BLANQUEAMIENTO', 'completada', '', '2026-04-30 01:03:13', '2026-04-30 17:47:10'),
(5, 2, 20, '2026-04-30', '10:00:00', '23:00:00', 'Carilla de resina (por pieza) (pieza 1)', 'completada', NULL, '2026-04-30 01:59:03', '2026-04-30 17:47:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id` int(11) NOT NULL,
  `clave` varchar(100) NOT NULL,
  `valor` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `configuracion`
--

INSERT INTO `configuracion` (`id`, `clave`, `valor`, `createdAt`, `updatedAt`) VALUES
(1, 'clinica_nombre', 'Clinica Dental Almar', '2026-04-12 01:09:17', '2026-04-25 09:07:18'),
(2, 'clinica_direccion', '', '2026-04-12 01:09:17', '2026-04-25 09:07:18'),
(3, 'clinica_telefono', '', '2026-04-12 01:09:17', '2026-04-25 09:07:18'),
(4, 'clinica_email', '', '2026-04-12 01:09:17', '2026-04-25 09:07:18'),
(5, 'clinica_horario_inicio', '09:00', '2026-04-12 01:09:17', '2026-04-25 09:07:18'),
(6, 'clinica_horario_fin', '19:00', '2026-04-12 01:09:17', '2026-04-25 09:07:18'),
(7, 'clinica_dias_laborales', 'Lunes a Sabado', '2026-04-12 01:09:17', '2026-04-25 09:07:18'),
(8, 'clinica_cuit', '', '2026-04-12 01:09:17', '2026-04-25 09:07:18'),
(9, 'clinica_responsable', 'Jessica Lizarraga', '2026-04-12 01:09:17', '2026-04-25 09:07:18'),
(10, 'moneda_simbolo', '$MXN', '2026-04-12 01:09:17', '2026-04-25 09:07:18'),
(11, 'duracion_turno_default', '30', '2026-04-12 01:09:17', '2026-04-25 09:07:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `consentimientos`
--

CREATE TABLE `consentimientos` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `tipo` varchar(150) NOT NULL COMMENT 'Ej: Extracción, Endodoncia, Ortodoncia, Implante, Blanqueamiento',
  `contenido` longtext NOT NULL,
  `firmado` tinyint(1) DEFAULT 0,
  `fecha_firma` datetime DEFAULT NULL,
  `ip_firma` varchar(50) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `consentimientos`
--

INSERT INTO `consentimientos` (`id`, `paciente_id`, `doctor_id`, `tipo`, `contenido`, `firmado`, `fecha_firma`, `ip_firma`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, 'Extracción dental', 'CONSENTIMIENTO INFORMADO PARA EXTRACCIÓN DENTAL\n\nYo, el/la paciente abajo firmante, declaro que he sido informado/a por mi odontólogo/a tratante sobre:\n\n1. DIAGNÓSTICO: Se me ha explicado la necesidad de realizar la extracción de la(s) pieza(s) dental(es) indicada(s).\n\n2. PROCEDIMIENTO: Consiste en la remoción quirúrgica de la pieza dental, bajo anestesia local. El procedimiento puede incluir incisión de encía, osteotomía y sutura.\n\n3. RIESGOS Y COMPLICACIONES POSIBLES:\n- Dolor, inflamación y sangrado post-operatorio\n- Infección de la herida quirúrgica\n- Hematoma o equimosis facial\n- Comunicación buco-sinusal (en piezas superiores)\n- Lesión temporal o permanente de nervios (parestesia)\n- Fractura de tabla ósea o de la pieza dental\n- Alveolitis seca\n\n4. ALTERNATIVAS: Se me han explicado las alternativas al tratamiento propuesto.\n\n5. POST-OPERATORIO: Me comprometo a seguir las indicaciones post-operatorias proporcionadas.\n\nHe podido formular todas las preguntas que he considerado oportunas y todas ellas han sido respondidas satisfactoriamente.', 1, '2026-04-29 23:14:27', '::1', '2026-04-29 22:46:24', '2026-04-29 23:14:27'),
(2, 3, 1, 'Extracción dental', 'CONSENTIMIENTO INFORMADO PARA EXTRACCIÓN DENTAL\n\nYo, el/la paciente abajo firmante, declaro que he sido informado/a por mi odontólogo/a tratante sobre:\n\n1. DIAGNÓSTICO: Se me ha explicado la necesidad de realizar la extracción de la(s) pieza(s) dental(es) indicada(s).\n\n2. PROCEDIMIENTO: Consiste en la remoción quirúrgica de la pieza dental, bajo anestesia local. El procedimiento puede incluir incisión de encía, osteotomía y sutura.\n\n3. RIESGOS Y COMPLICACIONES POSIBLES:\n- Dolor, inflamación y sangrado post-operatorio\n- Infección de la herida quirúrgica\n- Hematoma o equimosis facial\n- Comunicación buco-sinusal (en piezas superiores)\n- Lesión temporal o permanente de nervios (parestesia)\n- Fractura de tabla ósea o de la pieza dental\n- Alveolitis seca\n\n4. ALTERNATIVAS: Se me han explicado las alternativas al tratamiento propuesto.\n\n5. POST-OPERATORIO: Me comprometo a seguir las indicaciones post-operatorias proporcionadas.\n\nHe podido formular todas las preguntas que he considerado oportunas y todas ellas han sido respondidas satisfactoriamente.', 1, '2026-04-30 01:20:55', '::1', '2026-04-30 01:20:28', '2026-04-30 01:20:55'),
(3, 2, 22, 'Procedimiento general', 'CONSENTIMIENTO INFORMADO GENERAL\n\nYo, el/la paciente abajo firmante, declaro que:\n\n1. He sido informado/a sobre mi diagnóstico y el tratamiento propuesto.\n2. Se me han explicado los riesgos, beneficios y alternativas del procedimiento.\n3. He tenido la oportunidad de hacer preguntas y todas han sido respondidas.\n4. Autorizo al profesional a realizar el tratamiento descrito.\n5. Entiendo que pueden surgir situaciones imprevistas durante el procedimiento que requieran modificaciones al plan original.', 1, '2026-04-30 01:57:33', '::1', '2026-04-30 01:56:19', '2026-04-30 01:57:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_presupuestos`
--

CREATE TABLE `detalle_presupuestos` (
  `id` int(11) NOT NULL,
  `presupuesto_id` int(11) NOT NULL,
  `tratamiento_id` int(11) NOT NULL,
  `pieza_dental` int(11) DEFAULT NULL COMMENT 'Número de pieza dental (1-32)',
  `precio` decimal(10,2) NOT NULL,
  `estado` enum('pendiente','en_curso','completado') DEFAULT 'pendiente',
  `notas` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `detalle_presupuestos`
--

INSERT INTO `detalle_presupuestos` (`id`, `presupuesto_id`, `tratamiento_id`, `pieza_dental`, `precio`, `estado`, `notas`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, NULL, 5000.00, 'pendiente', NULL, '2026-04-29 23:02:57', '2026-04-29 23:02:57'),
(2, 1, 49, NULL, 45000.00, 'pendiente', NULL, '2026-04-29 23:02:57', '2026-04-29 23:02:57'),
(3, 2, 49, NULL, 45000.00, 'pendiente', NULL, '2026-04-30 01:02:21', '2026-04-30 01:02:21'),
(6, 5, 1, NULL, 5000.00, 'pendiente', NULL, '2026-04-30 01:50:44', '2026-04-30 01:50:44'),
(7, 6, 52, 3, 30000.00, 'pendiente', NULL, '2026-04-30 01:54:18', '2026-04-30 01:54:18'),
(8, 6, 4, NULL, 12000.00, 'pendiente', NULL, '2026-04-30 01:54:18', '2026-04-30 01:54:18'),
(9, 7, 52, 1, 30000.00, 'pendiente', NULL, '2026-04-30 01:55:06', '2026-04-30 01:55:06');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historia_clinica`
--

CREATE TABLE `historia_clinica` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `cita_id` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `diagnostico` text DEFAULT NULL,
  `tratamiento_realizado` text DEFAULT NULL,
  `piezas_tratadas` varchar(100) DEFAULT NULL COMMENT 'Piezas dentales separadas por coma',
  `receta` text DEFAULT NULL,
  `proxima_visita` text DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `historia_clinica`
--

INSERT INTO `historia_clinica` (`id`, `paciente_id`, `doctor_id`, `cita_id`, `fecha`, `diagnostico`, `tratamiento_realizado`, `piezas_tratadas`, `receta`, `proxima_visita`, `notas`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, NULL, '2026-04-29', '', '', '', '', NULL, '', '2026-04-29 23:21:33', '2026-04-29 23:21:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `log_actividad`
--

CREATE TABLE `log_actividad` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `accion` varchar(50) NOT NULL COMMENT 'crear, actualizar, eliminar, login, logout',
  `entidad` varchar(50) NOT NULL COMMENT 'paciente, cita, presupuesto, pago, etc.',
  `entidad_id` int(11) DEFAULT NULL,
  `detalle` text DEFAULT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `createdAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `log_actividad`
--

INSERT INTO `log_actividad` (`id`, `usuario_id`, `accion`, `entidad`, `entidad_id`, `detalle`, `ip`, `createdAt`) VALUES
(1, 1, 'crear', 'paciente', 1, 'POST /api/pacientes', '::1', '2026-04-29 22:42:58'),
(2, 21, 'crear', 'cita', 1, 'POST /api/citas', '::1', '2026-04-29 22:51:06'),
(3, 21, 'actualizar', 'cita', 1, 'PUT /api/citas/1', '::1', '2026-04-29 22:51:19'),
(4, 21, 'actualizar', 'paciente', 1, 'PUT /api/pacientes/1', '::1', '2026-04-29 22:51:47'),
(5, 21, 'crear', 'pago', 1, 'POST /api/pagos', '::1', '2026-04-29 22:53:00'),
(6, 21, 'crear', 'presupuesto', 1, 'POST /api/presupuestos', '::1', '2026-04-29 23:02:57'),
(7, 21, 'actualizar', 'presupuesto', 1, 'PUT /api/presupuestos/1', '::1', '2026-04-29 23:03:35'),
(8, 21, 'actualizar', 'presupuesto', 1, 'PUT /api/presupuestos/1', '::1', '2026-04-29 23:03:46'),
(9, 21, 'actualizar', 'presupuesto', 1, 'PUT /api/presupuestos/1', '::1', '2026-04-29 23:03:51'),
(10, 21, 'actualizar', 'cita', 1, 'PUT /api/citas/1', '::1', '2026-04-29 23:04:30'),
(11, 21, 'actualizar', 'presupuesto', 1, 'PUT /api/presupuestos/1', '::1', '2026-04-29 23:05:25'),
(12, 21, 'crear', 'pago', 2, 'POST /api/pagos', '::1', '2026-04-29 23:07:18'),
(13, 1, 'eliminar', 'pago', 1, 'DELETE /api/pagos/1', '::1', '2026-04-29 23:10:07'),
(14, 1, 'crear', 'pago', 3, 'POST /api/pagos', '::1', '2026-04-29 23:10:26'),
(15, 1, 'crear', 'paciente', 2, 'POST /api/pacientes', '::1', '2026-04-30 01:01:51'),
(16, 1, 'crear', 'presupuesto', 2, 'POST /api/presupuestos', '::1', '2026-04-30 01:02:21'),
(17, 1, 'actualizar', 'presupuesto', 2, 'PUT /api/presupuestos/2', '::1', '2026-04-30 01:02:25'),
(18, 1, 'crear', 'cita', 2, 'POST /api/citas', '::1', '2026-04-30 01:03:13'),
(19, 1, 'actualizar', 'cita', 2, 'PUT /api/citas/2', '::1', '2026-04-30 01:03:25'),
(20, 1, 'crear', 'pago', 4, 'POST /api/pagos', '::1', '2026-04-30 01:07:13'),
(21, 1, 'crear', 'paciente', 3, 'POST /api/pacientes', '::1', '2026-04-30 01:10:04'),
(22, 1, 'crear', 'presupuesto', 3, 'POST /api/presupuestos', '::1', '2026-04-30 01:11:24'),
(23, 1, 'actualizar', 'presupuesto', 3, 'PUT /api/presupuestos/3', '::1', '2026-04-30 01:11:28'),
(24, 1, 'crear', 'cita', 3, 'POST /api/citas', '::1', '2026-04-30 01:13:10'),
(25, 1, 'crear', 'cita', 4, 'POST /api/citas', '::1', '2026-04-30 01:14:47'),
(26, 1, 'actualizar', 'cita', 4, 'PUT /api/citas/4', '::1', '2026-04-30 01:14:58'),
(27, 1, 'actualizar', 'cita', 4, 'PUT /api/citas/4', '::1', '2026-04-30 01:17:02'),
(28, 1, 'crear', 'pago', 5, 'POST /api/pagos', '::1', '2026-04-30 01:18:39'),
(29, 1, 'crear', 'presupuesto', 4, 'POST /api/presupuestos', '::1', '2026-04-30 01:22:09'),
(30, 1, 'actualizar', 'presupuesto', 4, 'PUT /api/presupuestos/4', '::1', '2026-04-30 01:22:20'),
(31, 1, 'actualizar', 'presupuesto', 4, 'PUT /api/presupuestos/4', '::1', '2026-04-30 01:22:25'),
(32, 22, 'crear', 'presupuesto', 5, 'POST /api/presupuestos', '::1', '2026-04-30 01:50:44'),
(33, 22, 'actualizar', 'presupuesto', 5, 'PUT /api/presupuestos/5', '::1', '2026-04-30 01:50:47'),
(34, 22, 'crear', 'presupuesto', 6, 'POST /api/presupuestos', '::1', '2026-04-30 01:54:18'),
(35, 22, 'actualizar', 'presupuesto', 6, 'PUT /api/presupuestos/6', '::1', '2026-04-30 01:54:23'),
(36, 22, 'actualizar', 'presupuesto', 6, 'PUT /api/presupuestos/6', '::1', '2026-04-30 01:54:28'),
(37, 22, 'crear', 'presupuesto', 7, 'POST /api/presupuestos', '::1', '2026-04-30 01:55:06'),
(38, 22, 'actualizar', 'presupuesto', 7, 'PUT /api/presupuestos/7', '::1', '2026-04-30 01:55:13'),
(39, 22, 'crear', 'cita', 5, 'POST /api/citas', '::1', '2026-04-30 01:59:03'),
(40, 22, 'crear', 'pago', 6, 'POST /api/pagos', '::1', '2026-04-30 01:59:56'),
(41, 22, 'actualizar', 'cita', 1, 'PUT /api/citas/1', '::1', '2026-04-30 17:14:46'),
(42, 22, 'actualizar', 'cita', 2, 'PUT /api/citas/2', '::1', '2026-04-30 17:14:50'),
(43, 22, 'actualizar', 'cita', 5, 'PUT /api/citas/5', '::1', '2026-04-30 17:14:55'),
(44, 1, 'crear', 'pago', 7, 'POST /api/pagos', '::1', '2026-04-30 17:37:22'),
(45, 1, 'actualizar', 'cita', 1, 'PUT /api/citas/1', '::1', '2026-04-30 17:37:49'),
(46, 1, 'actualizar', 'cita', 2, 'PUT /api/citas/2', '::1', '2026-04-30 17:47:10'),
(47, 1, 'actualizar', 'cita', 5, 'PUT /api/citas/5', '::1', '2026-04-30 17:47:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `odontograma`
--

CREATE TABLE `odontograma` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `pieza_dental` int(11) NOT NULL COMMENT 'Número de pieza dental (11-48 notación FDI)',
  `cara` enum('vestibular','lingual','mesial','distal','oclusal','completa') DEFAULT 'completa',
  `estado` enum('sano','caries','obturacion','corona','extraccion','endodoncia','implante','protesis','ausente','fractura') DEFAULT 'sano',
  `observacion` text DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `odontograma`
--

INSERT INTO `odontograma` (`id`, `paciente_id`, `pieza_dental`, `cara`, `estado`, `observacion`, `doctor_id`, `fecha`, `createdAt`, `updatedAt`) VALUES
(1, 3, 14, 'completa', 'caries', NULL, 1, '2026-04-30', '2026-04-30 17:32:05', '2026-04-30 17:32:05'),
(2, 3, 14, 'completa', 'sano', NULL, 1, '2026-04-30', '2026-04-30 17:33:02', '2026-04-30 17:33:02'),
(3, 3, 14, 'completa', 'sano', NULL, 1, '2026-04-30', '2026-04-30 17:33:13', '2026-04-30 17:33:13'),
(4, 3, 17, 'completa', 'obturacion', NULL, 1, '2026-04-30', '2026-04-30 17:34:23', '2026-04-30 17:34:23'),
(5, 3, 18, 'completa', 'obturacion', NULL, 1, '2026-04-30', '2026-04-30 17:34:26', '2026-04-30 17:34:26'),
(6, 3, 18, 'completa', 'caries', NULL, 1, '2026-04-30', '2026-04-30 17:34:35', '2026-04-30 17:34:35');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pacientes`
--

CREATE TABLE `pacientes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `dni` varchar(20) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` enum('masculino','femenino','otro') DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `obra_social` varchar(100) DEFAULT NULL,
  `numero_afiliado` varchar(50) DEFAULT NULL,
  `antecedentes_medicos` text DEFAULT NULL,
  `alergias` text DEFAULT NULL,
  `medicamentos` text DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pacientes`
--

INSERT INTO `pacientes` (`id`, `nombre`, `apellido`, `dni`, `fecha_nacimiento`, `genero`, `telefono`, `email`, `direccion`, `obra_social`, `numero_afiliado`, `antecedentes_medicos`, `alergias`, `medicamentos`, `notas`, `activo`, `createdAt`, `updatedAt`) VALUES
(1, 'Alan', 'Mendez', '384511984', '2000-07-01', 'masculino', '6692204976', '', '', '', '', '', '', '', '', 1, '2026-04-29 22:42:58', '2026-04-29 22:51:47'),
(2, 'JUAN', 'PERERZ', '147850290221', '2002-08-17', 'masculino', '6694415910', '', '', '', '', '', '', '', '', 1, '2026-04-30 01:01:51', '2026-04-30 01:01:51'),
(3, 'ARON ', 'HERNANDEZ', '3802119681849', '2000-07-01', 'masculino', '6692204976', 'alanmendez530@gmail.com', '', '', '', '', '', '', '', 1, '2026-04-30 01:10:04', '2026-04-30 01:10:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `presupuesto_id` int(11) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','tarjeta_debito','tarjeta_credito','transferencia') NOT NULL,
  `fecha` date NOT NULL,
  `numero_recibo` varchar(50) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `paciente_id`, `presupuesto_id`, `monto`, `metodo_pago`, `fecha`, `numero_recibo`, `notas`, `createdAt`, `updatedAt`) VALUES
(2, 1, 1, 49800.00, 'efectivo', '2026-04-29', '', 'Liquido', '2026-04-29 23:07:18', '2026-04-29 23:07:18'),
(3, 1, 1, 200.00, 'efectivo', '2026-04-29', '', '', '2026-04-29 23:10:26', '2026-04-29 23:10:26'),
(4, 2, 2, 2000.00, 'tarjeta_debito', '2026-04-30', '', 'ANTICIPO', '2026-04-30 01:07:13', '2026-04-30 01:07:13'),
(5, 3, NULL, 5000.00, 'tarjeta_debito', '2026-04-30', '', '', '2026-04-30 01:18:39', '2026-04-30 01:18:39'),
(6, 2, 7, 30000.00, 'tarjeta_debito', '2026-04-30', NULL, 'liquido', '2026-04-30 01:59:56', '2026-04-30 01:59:56'),
(7, 2, 2, 43000.00, 'efectivo', '2026-04-30', '', '', '2026-04-30 17:37:22', '2026-04-30 17:37:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `presupuestos`
--

CREATE TABLE `presupuestos` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `estado` enum('pendiente','aceptado','en_curso','finalizado','rechazado') DEFAULT 'pendiente',
  `total` decimal(10,2) DEFAULT 0.00,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `notas` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `presupuestos`
--

INSERT INTO `presupuestos` (`id`, `paciente_id`, `doctor_id`, `estado`, `total`, `descuento`, `notas`, `createdAt`, `updatedAt`) VALUES
(1, 1, 21, 'aceptado', 50000.00, 0.00, '', '2026-04-29 23:02:57', '2026-04-29 23:05:25'),
(2, 2, 21, 'aceptado', 45000.00, 0.00, '', '2026-04-30 01:02:21', '2026-04-30 01:02:25'),
(5, 3, 20, 'aceptado', 5000.00, 0.00, '', '2026-04-30 01:50:44', '2026-04-30 01:50:47'),
(6, 2, 20, 'rechazado', 42000.00, 0.00, '', '2026-04-30 01:54:18', '2026-04-30 01:54:28'),
(7, 2, 20, 'aceptado', 30000.00, 0.00, '', '2026-04-30 01:55:06', '2026-04-30 01:55:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tratamientos`
--

CREATE TABLE `tratamientos` (
  `id` int(11) NOT NULL,
  `categoria_id` int(11) DEFAULT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `duracion_minutos` int(11) DEFAULT 30,
  `activo` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tratamientos`
--

INSERT INTO `tratamientos` (`id`, `categoria_id`, `nombre`, `descripcion`, `precio`, `duracion_minutos`, `activo`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Consulta de diagnóstico', NULL, 5000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(2, 1, 'Plan de tratamiento integral', NULL, 3000.00, 45, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(3, 1, 'Consulta de urgencia', NULL, 8000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(4, 2, 'Limpieza dental (profilaxis)', NULL, 12000.00, 40, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(5, 2, 'Aplicación de flúor', NULL, 5000.00, 15, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(6, 2, 'Sellador de fosas y fisuras (por pieza)', NULL, 6000.00, 20, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(7, 2, 'Destartraje (remoción de sarro)', NULL, 15000.00, 45, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(8, 3, 'Obturación simple (resina)', NULL, 15000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(9, 3, 'Obturación compuesta (resina)', NULL, 20000.00, 45, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(10, 3, 'Obturación compleja (resina)', NULL, 25000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(11, 3, 'Incrustación de porcelana', NULL, 45000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(12, 3, 'Reconstrucción con perno', NULL, 35000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(13, 4, 'Tratamiento de conducto (unirradicular)', NULL, 35000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(14, 4, 'Tratamiento de conducto (birradicular)', NULL, 45000.00, 90, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(15, 4, 'Tratamiento de conducto (multirradicular)', NULL, 55000.00, 90, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(16, 4, 'Retratamiento de conducto', NULL, 50000.00, 90, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(17, 4, 'Pulpotomía', NULL, 18000.00, 45, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(18, 5, 'Raspaje y alisado radicular (por cuadrante)', NULL, 18000.00, 45, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(19, 5, 'Cirugía periodontal (por cuadrante)', NULL, 40000.00, 90, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(20, 5, 'Injerto de encía', NULL, 55000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(21, 5, 'Alargamiento de corona clínica', NULL, 35000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(22, 6, 'Extracción simple', NULL, 12000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(23, 6, 'Extracción compleja', NULL, 20000.00, 45, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(24, 6, 'Extracción de tercer molar (muela de juicio)', NULL, 35000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(25, 6, 'Extracción de tercer molar incluido', NULL, 50000.00, 90, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(26, 6, 'Biopsia de tejidos blandos', NULL, 25000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(27, 6, 'Frenectomía', NULL, 20000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(28, 7, 'Corona de porcelana', NULL, 65000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(29, 7, 'Corona de zirconio', NULL, 85000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(30, 7, 'Corona provisoria', NULL, 15000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(31, 7, 'Puente fijo (por pieza)', NULL, 65000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(32, 7, 'Prótesis parcial removible', NULL, 80000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(33, 7, 'Prótesis completa (por arcada)', NULL, 120000.00, 90, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(34, 7, 'Reparación de prótesis', NULL, 18000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(35, 7, 'Rebasado de prótesis', NULL, 25000.00, 45, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(36, 8, 'Estudio de ortodoncia completo', NULL, 25000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(37, 8, 'Brackets metálicos (tratamiento completo)', NULL, 350000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(38, 8, 'Brackets estéticos (tratamiento completo)', NULL, 450000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(39, 8, 'Alineadores transparentes', NULL, 550000.00, 45, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(40, 8, 'Control de ortodoncia mensual', NULL, 12000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(41, 8, 'Contención fija', NULL, 25000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(42, 8, 'Placa de contención removible', NULL, 30000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(43, 9, 'Implante dental (pieza)', NULL, 250000.00, 90, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(44, 9, 'Pilar protésico sobre implante', NULL, 60000.00, 45, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(45, 9, 'Corona sobre implante', NULL, 85000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(46, 9, 'Elevación de seno maxilar', NULL, 180000.00, 120, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(47, 9, 'Injerto óseo', NULL, 120000.00, 90, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(48, 9, 'Prótesis sobre implantes (arcada completa)', NULL, 800000.00, 120, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(49, 10, 'Blanqueamiento en consultorio', NULL, 45000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(50, 10, 'Blanqueamiento con cubetas (domiciliario)', NULL, 30000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(51, 10, 'Carilla de porcelana (por pieza)', NULL, 75000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(52, 10, 'Carilla de resina (por pieza)', NULL, 30000.00, 45, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(53, 10, 'Diseño de sonrisa (diagnóstico)', NULL, 20000.00, 60, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(54, 11, 'Consulta pediátrica', NULL, 5000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(55, 11, 'Pulpotomía en diente temporal', NULL, 15000.00, 40, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(56, 11, 'Corona de acero (diente temporal)', NULL, 18000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(57, 11, 'Mantenedor de espacio', NULL, 25000.00, 45, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(58, 11, 'Obturación en diente temporal', NULL, 10000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(59, 12, 'Radiografía periapical', NULL, 3000.00, 10, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(60, 12, 'Radiografía panorámica', NULL, 8000.00, 15, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(61, 12, 'Radiografía oclusal', NULL, 4000.00, 10, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(62, 12, 'Tomografía Cone Beam (CBCT)', NULL, 25000.00, 20, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31'),
(63, 12, 'Serie radiográfica completa', NULL, 15000.00, 30, 1, '2026-04-21 14:13:31', '2026-04-21 14:13:31');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('administrador','doctor','recepcionista') NOT NULL DEFAULT 'recepcionista',
  `especialidad` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `password`, `rol`, `especialidad`, `telefono`, `activo`, `createdAt`, `updatedAt`) VALUES
(1, 'Admin', 'Sistema', 'admin@clinica.com', '$2a$10$FsbBHK9zBrUsmzWWuPSPSeBzkaVRDfopOAjNTE8TgaSVHC71FO1Fy', 'administrador', NULL, NULL, 1, '2026-04-10 06:42:08', '2026-04-10 06:42:08'),
(20, 'Monserrath', 'Meza', 'monse@clinica.com', '$2a$10$4kTQK4ldJrpnEWtxioDul.ZWPKSKAfdQ0S6OaWMIEwbNCtu2WY/wy', 'doctor', 'Cirujano Dentista', '6547891234', 1, '2026-04-25 17:56:43', '2026-04-25 17:56:53'),
(21, 'Brandova', 'Cantu', 'yulissaechamea@gmail.com', '$2a$10$nFTBasPCgCIgFpKLfood/.NtnxqchdShYWdRQpksZsSW46XpADxJi', 'doctor', 'Odontologa', '', 1, '2026-04-29 22:49:21', '2026-04-29 22:49:21'),
(22, 'jessica ', 'lizarraga', 'jessica@clinica.com', '$2a$10$JUk3tcSHgRyhhDw36mdT9ek3p507pOitlVrdJVTnelVx0EWfcObPC', 'administrador', '', '6691587825', 1, '2026-04-30 01:48:48', '2026-04-30 01:48:48');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias_tratamiento`
--
ALTER TABLE `categorias_tratamiento`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `citas`
--
ALTER TABLE `citas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `clave` (`clave`),
  ADD UNIQUE KEY `clave_2` (`clave`),
  ADD UNIQUE KEY `clave_3` (`clave`),
  ADD UNIQUE KEY `clave_4` (`clave`),
  ADD UNIQUE KEY `clave_5` (`clave`),
  ADD UNIQUE KEY `clave_6` (`clave`),
  ADD UNIQUE KEY `clave_7` (`clave`),
  ADD UNIQUE KEY `clave_8` (`clave`),
  ADD UNIQUE KEY `clave_9` (`clave`),
  ADD UNIQUE KEY `clave_10` (`clave`),
  ADD UNIQUE KEY `clave_11` (`clave`),
  ADD UNIQUE KEY `clave_12` (`clave`),
  ADD UNIQUE KEY `clave_13` (`clave`),
  ADD UNIQUE KEY `clave_14` (`clave`),
  ADD UNIQUE KEY `clave_15` (`clave`),
  ADD UNIQUE KEY `clave_16` (`clave`),
  ADD UNIQUE KEY `clave_17` (`clave`),
  ADD UNIQUE KEY `clave_18` (`clave`),
  ADD UNIQUE KEY `clave_19` (`clave`),
  ADD UNIQUE KEY `clave_20` (`clave`),
  ADD UNIQUE KEY `clave_21` (`clave`),
  ADD UNIQUE KEY `clave_22` (`clave`),
  ADD UNIQUE KEY `clave_23` (`clave`),
  ADD UNIQUE KEY `clave_24` (`clave`),
  ADD UNIQUE KEY `clave_25` (`clave`),
  ADD UNIQUE KEY `clave_26` (`clave`),
  ADD UNIQUE KEY `clave_27` (`clave`);

--
-- Indices de la tabla `consentimientos`
--
ALTER TABLE `consentimientos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indices de la tabla `detalle_presupuestos`
--
ALTER TABLE `detalle_presupuestos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `presupuesto_id` (`presupuesto_id`),
  ADD KEY `tratamiento_id` (`tratamiento_id`);

--
-- Indices de la tabla `historia_clinica`
--
ALTER TABLE `historia_clinica`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `cita_id` (`cita_id`);

--
-- Indices de la tabla `log_actividad`
--
ALTER TABLE `log_actividad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `odontograma`
--
ALTER TABLE `odontograma`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indices de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dni` (`dni`),
  ADD UNIQUE KEY `dni_2` (`dni`),
  ADD UNIQUE KEY `dni_3` (`dni`),
  ADD UNIQUE KEY `dni_4` (`dni`),
  ADD UNIQUE KEY `dni_5` (`dni`),
  ADD UNIQUE KEY `dni_6` (`dni`),
  ADD UNIQUE KEY `dni_7` (`dni`),
  ADD UNIQUE KEY `dni_8` (`dni`),
  ADD UNIQUE KEY `dni_9` (`dni`),
  ADD UNIQUE KEY `dni_10` (`dni`),
  ADD UNIQUE KEY `dni_11` (`dni`),
  ADD UNIQUE KEY `dni_12` (`dni`),
  ADD UNIQUE KEY `dni_13` (`dni`),
  ADD UNIQUE KEY `dni_14` (`dni`),
  ADD UNIQUE KEY `dni_15` (`dni`),
  ADD UNIQUE KEY `dni_16` (`dni`),
  ADD UNIQUE KEY `dni_17` (`dni`),
  ADD UNIQUE KEY `dni_18` (`dni`),
  ADD UNIQUE KEY `dni_19` (`dni`),
  ADD UNIQUE KEY `dni_20` (`dni`),
  ADD UNIQUE KEY `dni_21` (`dni`),
  ADD UNIQUE KEY `dni_22` (`dni`),
  ADD UNIQUE KEY `dni_23` (`dni`),
  ADD UNIQUE KEY `dni_24` (`dni`),
  ADD UNIQUE KEY `dni_25` (`dni`),
  ADD UNIQUE KEY `dni_26` (`dni`),
  ADD UNIQUE KEY `dni_27` (`dni`),
  ADD UNIQUE KEY `dni_28` (`dni`),
  ADD UNIQUE KEY `dni_29` (`dni`),
  ADD UNIQUE KEY `dni_30` (`dni`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `presupuesto_id` (`presupuesto_id`);

--
-- Indices de la tabla `presupuestos`
--
ALTER TABLE `presupuestos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indices de la tabla `tratamientos`
--
ALTER TABLE `tratamientos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoria_id` (`categoria_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `email_3` (`email`),
  ADD UNIQUE KEY `email_4` (`email`),
  ADD UNIQUE KEY `email_5` (`email`),
  ADD UNIQUE KEY `email_6` (`email`),
  ADD UNIQUE KEY `email_7` (`email`),
  ADD UNIQUE KEY `email_8` (`email`),
  ADD UNIQUE KEY `email_9` (`email`),
  ADD UNIQUE KEY `email_10` (`email`),
  ADD UNIQUE KEY `email_11` (`email`),
  ADD UNIQUE KEY `email_12` (`email`),
  ADD UNIQUE KEY `email_13` (`email`),
  ADD UNIQUE KEY `email_14` (`email`),
  ADD UNIQUE KEY `email_15` (`email`),
  ADD UNIQUE KEY `email_16` (`email`),
  ADD UNIQUE KEY `email_17` (`email`),
  ADD UNIQUE KEY `email_18` (`email`),
  ADD UNIQUE KEY `email_19` (`email`),
  ADD UNIQUE KEY `email_20` (`email`),
  ADD UNIQUE KEY `email_21` (`email`),
  ADD UNIQUE KEY `email_22` (`email`),
  ADD UNIQUE KEY `email_23` (`email`),
  ADD UNIQUE KEY `email_24` (`email`),
  ADD UNIQUE KEY `email_25` (`email`),
  ADD UNIQUE KEY `email_26` (`email`),
  ADD UNIQUE KEY `email_27` (`email`),
  ADD UNIQUE KEY `email_28` (`email`),
  ADD UNIQUE KEY `email_29` (`email`),
  ADD UNIQUE KEY `email_30` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias_tratamiento`
--
ALTER TABLE `categorias_tratamiento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `citas`
--
ALTER TABLE `citas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `consentimientos`
--
ALTER TABLE `consentimientos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `detalle_presupuestos`
--
ALTER TABLE `detalle_presupuestos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `historia_clinica`
--
ALTER TABLE `historia_clinica`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `log_actividad`
--
ALTER TABLE `log_actividad`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT de la tabla `odontograma`
--
ALTER TABLE `odontograma`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `presupuestos`
--
ALTER TABLE `presupuestos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `tratamientos`
--
ALTER TABLE `tratamientos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `citas`
--
ALTER TABLE `citas`
  ADD CONSTRAINT `citas_ibfk_57` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `citas_ibfk_58` FOREIGN KEY (`doctor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `consentimientos`
--
ALTER TABLE `consentimientos`
  ADD CONSTRAINT `consentimientos_ibfk_53` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `consentimientos_ibfk_54` FOREIGN KEY (`doctor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `detalle_presupuestos`
--
ALTER TABLE `detalle_presupuestos`
  ADD CONSTRAINT `detalle_presupuestos_ibfk_57` FOREIGN KEY (`presupuesto_id`) REFERENCES `presupuestos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `detalle_presupuestos_ibfk_58` FOREIGN KEY (`tratamiento_id`) REFERENCES `tratamientos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `historia_clinica`
--
ALTER TABLE `historia_clinica`
  ADD CONSTRAINT `historia_clinica_ibfk_81` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `historia_clinica_ibfk_82` FOREIGN KEY (`doctor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `historia_clinica_ibfk_83` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `log_actividad`
--
ALTER TABLE `log_actividad`
  ADD CONSTRAINT `log_actividad_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `odontograma`
--
ALTER TABLE `odontograma`
  ADD CONSTRAINT `odontograma_ibfk_57` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `odontograma_ibfk_58` FOREIGN KEY (`doctor_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_57` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `pagos_ibfk_58` FOREIGN KEY (`presupuesto_id`) REFERENCES `presupuestos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `presupuestos`
--
ALTER TABLE `presupuestos`
  ADD CONSTRAINT `presupuestos_ibfk_57` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `presupuestos_ibfk_58` FOREIGN KEY (`doctor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `tratamientos`
--
ALTER TABLE `tratamientos`
  ADD CONSTRAINT `tratamientos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_tratamiento` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

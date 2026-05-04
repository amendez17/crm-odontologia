import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import PacienteDetalle from './pages/PacienteDetalle';
import Citas from './pages/Citas';
import Tratamientos from './pages/Tratamientos';
import Presupuestos from './pages/Presupuestos';
import Pagos from './pages/Pagos';
import Usuarios from './pages/Usuarios';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import Actividad from './pages/Actividad';
import Mantenimiento from './pages/Mantenimiento';

function PrivateRoute({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  return usuario ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="pacientes/:id" element={<PacienteDetalle />} />
          <Route path="citas" element={<Citas />} />
          <Route path="tratamientos" element={<Tratamientos />} />
          <Route path="presupuestos" element={<Presupuestos />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="actividad" element={<Actividad />} />
          <Route path="mantenimiento" element={<Mantenimiento />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </>
  );
}

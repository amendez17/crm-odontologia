import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔐 Ruta correcta del backend
      const { data } = await api.post('/api/auth/login', {
        email,
        password
      });

      // guardar sesión
      login(data.token, data.usuario);

      toast.success('Bienvenido 👋');
      navigate('/');

    } catch (err) {
      console.log('ERROR LOGIN:', err.response?.data || err.message);

      toast.error(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al iniciar sesión'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-800 via-primary-600 to-dental-500 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-dental-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary-300/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 border border-white/60">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-dental-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">🦷</span>
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-700 to-dental-600 bg-clip-text text-transparent">
              Clinica Dental Almar
            </h1>
            <p className="text-surface-400 text-sm mt-1">Sistema de gestión odontológica</p>
          </div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md w-96 space-y-4">

        <h1 className="text-xl font-bold text-center">Iniciar sesión</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>

      </form>
    </div>
  );
}

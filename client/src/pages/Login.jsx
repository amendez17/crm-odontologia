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
      const { data } = await api.post('/auth/login', {
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
  <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-slate-50 to-slate-100 relative overflow-hidden">

    {/* Fondo suave tipo Apple */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-slate-200/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-200/20 rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-[#c9a227]/10 rounded-full blur-3xl" />
    </div>

    {/* Card principal */}
    <div className="relative w-full max-w-md animate-slide-up">
      <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white/40 p-8">

        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 blur-xl" />

          <img
            src="/logo_clinica-removebg-preview.png"
            alt="Clinica Dental Almar"
            className="w-14 h-14 object-contain relative z-10"
          />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-800 text-center">
          Clinica Dental Almar
        </h1>

        <p className="text-slate-500 text-sm mt-1 text-center">
          Sistema de gestión odontológica
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 rounded-xl px-4 py-3 text-base outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition"
              placeholder="admin@clinica.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 rounded-xl px-4 py-3 text-base outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-medium text-white transition-all shadow-md hover:shadow-xl active:scale-[0.98]
            bg-gradient-to-r from-[#c9a227] via-[#b89b5e] to-[#d6c28a] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Ingresando...
              </span>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Clínica Dental • Sistema seguro de gestión odontológica
          </p>
        </div>

      </div>
    </div>
  </div>
);
}

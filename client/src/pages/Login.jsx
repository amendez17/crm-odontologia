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
  
  {/* Background decorations */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute -top-40 -right-40 w-96 h-96 bg-slate-300/10 rounded-full" />
    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-200/10 rounded-full" />
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-300/10 rounded-full blur-3xl" />
    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-slate-300/10 rounded-full blur-3xl" />
  </div>

  <div className="relative w-full max-w-md animate-slide-up">
    
    <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 border border-slate-200">
      
      {/* Logo */}
      <div className="text-center mb-8">
        
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <img 
            src="/logo_clinica-removebg-preview.png" 
            alt="Clinica Dental Almar"
            className="w-14 h-14 object-contain"
          />
        </div>

        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-800 via-slate-700 to-amber-500 bg-clip-text text-transparent">
          Clinica Dental Almar
        </h1>

        <p className="text-slate-500 text-sm mt-1">
          Sistema de gestión odontológica
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
            placeholder="admin@clinica.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-white py-3 rounded-2xl font-bold text-base hover:from-amber-600 hover:via-amber-500 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Ingresando...
            </span>
          ) : (
            'Iniciar sesión'
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 p-3 bg-slate-50 rounded-2xl border border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          ¡Gracias por su preferencia, su salud es primero!
        </p>
      </div>

    </div>
  </div>
</div>

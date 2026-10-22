import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  FlaskIcon,
  InventoryIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
  TercerosIcon,
  TrendingUpIcon,
} from '../components/Icons';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      setError('Complete todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(usuario, password);
      navigate('/', { replace: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al iniciar sesión';
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        setError('Credenciales inválidas');
      } else {
        setError('Error de conexión con el servidor');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      {/* Ambiente */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-500/10" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-slate-300/20 blur-3xl dark:bg-slate-700/10" />
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
        className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm backdrop-blur transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-100 sm:right-6 sm:top-6"
      >
        {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Presentación */}
          <section className="hidden lg:block">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-10 text-white shadow-2xl shadow-slate-900/20 ring-1 ring-white/10">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
                aria-hidden="true"
              />
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
                    <FlaskIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold tracking-tight">SueroControl</p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">
                      Gestión clínica
                    </p>
                  </div>
                </div>

                <h2 className="mt-12 max-w-md text-3xl font-semibold leading-tight tracking-tight">
                  Control total de tu inventario, ventas y rentabilidad.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
                  Una plataforma pensada para clínicas que necesitan claridad operativa,
                  trazabilidad y decisiones basadas en datos.
                </p>

                <div className="mt-10 space-y-4">
                  {[
                    {
                      icon: InventoryIcon,
                      title: 'Inventario en tiempo real',
                      text: 'Stock por almacén y traslados controlados.',
                    },
                    {
                      icon: TrendingUpIcon,
                      title: 'Rentabilidad visible',
                      text: 'Utilidades, márgenes y ganancias por profesional.',
                    },
                    {
                      icon: TercerosIcon,
                      title: 'Gestión centralizada',
                      text: 'Clientes, proveedores y médicos en un solo lugar.',
                    },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-blue-300 ring-1 ring-white/10">
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{item.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-12 text-[11px] text-slate-500">
                  SueroControl v3.0.0 · Sistema de Gestión Clínica
                </p>
              </div>
            </div>
          </section>

          {/* Formulario */}
          <section className="w-full">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                  <FlaskIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                    SueroControl
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                    Gestión clínica
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-900/5 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-9">
                <div className="mb-7">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Acceso seguro
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    Iniciar sesión
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Ingresa tus credenciales para continuar.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="usuario"
                      className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Usuario o correo
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                        <TercerosIcon className="h-[18px] w-[18px]" />
                      </span>
                      <input
                        id="usuario"
                        type="text"
                        value={usuario}
                        onChange={e => setUsuario(e.target.value)}
                        placeholder="Ingrese su usuario o correo"
                        autoFocus
                        autoComplete="username"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Contraseña
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                        <ShieldIcon className="h-[18px] w-[18px]" />
                      </span>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Ingrese su contraseña"
                        autoComplete="current-password"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-20 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                      >
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 dark:border-red-500/30 dark:bg-red-500/10">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 focus:ring-4 focus:ring-slate-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:text-white dark:shadow-blue-500/20 dark:hover:bg-blue-400 cursor-pointer"
                  >
                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </button>
                </form>

                <p className="mt-7 text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  SueroControl v3.0.0
                  <span className="mx-1.5 text-slate-300 dark:text-slate-700">·</span>
                  Sistema de Gestión Clínica
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// BerryVision AI - Configuración Page
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Bell,
  User,
  Shield,
  Database,
  Palette,
  Globe,
  Key,
  Mail,
  Smartphone,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Save,
  Check
} from 'lucide-react';

export default function ConfiguracionPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    critical: true,
    alerts: true,
    reports: false,
  });
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('es');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Configuración</h1>
                <p className="text-sm text-gray-400">
                  Personaliza tu experiencia
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Guardado</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Perfil</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre</label>
                <input
                  type="text"
                  defaultValue="Agrónomo Demo"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="admin@berryvision.ai"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Rol</label>
                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50">
                  <option value="agronomist">Agrónomo</option>
                  <option value="manager">Gerente</option>
                  <option value="field_worker">Trabajador de Campo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Teléfono</label>
                <input
                  type="tel"
                  placeholder="+52 XXX XXX XXXX"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Notificaciones</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'email', label: 'Notificaciones por Email', icon: Mail },
                { key: 'push', label: 'Notificaciones Push', icon: Smartphone },
                { key: 'critical', label: 'Alertas Críticas', icon: Volume2 },
                { key: 'alerts', label: 'Todas las Alertas', icon: Bell },
                { key: 'reports', label: 'Reportes Automáticos', icon: Database },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="text-white">{item.label}</span>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications({
                          ...notifications,
                          [item.key]: !notifications[item.key as keyof typeof notifications],
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications[item.key as keyof typeof notifications]
                          ? 'bg-emerald-500'
                          : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          notifications[item.key as keyof typeof notifications]
                            ? 'translate-x-7'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Apariencia</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-3">Tema</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-colors ${
                      theme === 'dark'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    <span>Oscuro</span>
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-colors ${
                      theme === 'light'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span>Claro</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Idioma</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* API Keys Section */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Configuración de APIs</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Supabase URL</label>
                <input
                  type="text"
                  placeholder="https://xxx.supabase.co"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">OpenAI API Key</label>
                <input
                  type="password"
                  placeholder="sk-••••••••••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                />
              </div>
              <p className="text-gray-500 text-sm">
                Las claves de API se almacenan de forma segura y nunca se comparten.
              </p>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Seguridad</h2>
            </div>
            <div className="space-y-4">
              <button className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Cambiar Contraseña</p>
                    <p className="text-gray-400 text-sm">Última actualización hace 30 días</p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </div>
              </button>
              <button className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Autenticación de Dos Factores</p>
                    <p className="text-gray-400 text-sm">No configurado</p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </div>
              </button>
              <button className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Sesiones Activas</p>
                    <p className="text-gray-400 text-sm">1 dispositivo activo</p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </div>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-gradient-to-br from-red-500/5 to-red-500/[0.02] rounded-2xl border border-red-500/20 p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-4">Zona de Peligro</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl">
                <div>
                  <p className="text-white font-medium">Eliminar todos los datos</p>
                  <p className="text-gray-400 text-sm">Esta acción es irreversible</p>
                </div>
                <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-colors">
                  Eliminar
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl">
                <div>
                  <p className="text-white font-medium">Eliminar cuenta</p>
                  <p className="text-gray-400 text-sm">Perderás acceso permanentemente</p>
                </div>
                <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

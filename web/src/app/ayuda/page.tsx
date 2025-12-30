// Cultivo Vision - Instructivo y Ayuda
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  HelpCircle,
  Camera,
  Sprout,
  Beaker,
  ChevronDown,
  ChevronRight,
  Leaf,
  Bug,
  AlertTriangle,
  Droplets,
  Calendar,
  MapPin,
  FileText,
  Bell,
  Settings,
  CheckCircle
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
}

const sections: Section[] = [
  { id: 'inicio', title: 'Primeros Pasos', icon: Leaf, color: 'text-green-400' },
  { id: 'cultivos', title: 'Alta de Cultivos', icon: Sprout, color: 'text-blue-400' },
  { id: 'bitacora', title: 'Bitacora de Campo', icon: Camera, color: 'text-purple-400' },
  { id: 'catalogos', title: 'Catalogos', icon: Beaker, color: 'text-amber-400' },
  { id: 'alertas', title: 'Alertas del Sistema', icon: Bell, color: 'text-red-400' },
];

export default function AyudaPage() {
  const [activeSection, setActiveSection] = useState('inicio');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqs = [
    {
      id: 'faq1',
      question: 'Como subo fotos desde el celular?',
      answer: 'Abre la pagina de Bitacora en tu celular, toca el boton "Nuevo Registro", luego toca el area de la camara para tomar o seleccionar una foto. La imagen se sube automaticamente.'
    },
    {
      id: 'faq2',
      question: 'Como agrego un nuevo problema al catalogo?',
      answer: 'Ve a Catalogos en el menu lateral, selecciona la categoria (Plagas, Enfermedades, etc.), y haz clic en "Agregar". Llena el nombre y descripcion del nuevo elemento.'
    },
    {
      id: 'faq3',
      question: 'Que significan los niveles de severidad?',
      answer: 'BAJA: Problema menor que no requiere accion inmediata. MEDIA: Requiere atencion pero no es urgente. ALTA: Problema serio que debe atenderse pronto. CRITICA: Emergencia que requiere accion inmediata.'
    },
    {
      id: 'faq4',
      question: 'Como funciona el numero de semana?',
      answer: 'El sistema calcula automaticamente la semana del anio (1-52) basado en la fecha del registro. Esto ayuda a organizar los registros por semana agricola.'
    },
    {
      id: 'faq5',
      question: 'Puedo editar un registro despues de guardarlo?',
      answer: 'Por ahora los registros no se pueden editar una vez guardados. Si cometiste un error, puedes crear un nuevo registro con la informacion correcta y agregar una nota explicando la correccion.'
    },
    {
      id: 'faq6',
      question: 'Como recibo alertas cuando no hay actividad?',
      answer: 'El sistema revisa automaticamente de lunes a viernes si hubo registros en la bitacora. Si no hay actividad, se genera una alerta que puedes ver en la seccion de Alertas.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-green-400" />
                Instructivo de Uso
              </h1>
              <p className="text-sm text-gray-500">
                Guia completa para usar Cultivo Vision
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <h2 className="text-white font-semibold mb-4 px-3">Contenido</h2>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <section.icon className={`w-4 h-4 ${section.color}`} />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenido */}
          <div className="lg:col-span-3 space-y-8">
            {/* Primeros Pasos */}
            {activeSection === 'inicio' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl border border-green-500/20 p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <Leaf className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a Cultivo Vision</h2>
                      <p className="text-gray-400">
                        Sistema de bitacora de campo para documentar problemas en cultivos.
                        Registra plagas, enfermedades, problemas de nutricion y riego con fotos y tratamientos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Sprout className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-white font-semibold">1. Registra tus Cultivos</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Primero da de alta los cultivos que tienes: variedad, sector, fecha de plantacion, etc.
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Camera className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-white font-semibold">2. Documenta en Campo</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Cuando veas un problema, toma foto y registralo en la bitacora con el tipo y severidad.
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Beaker className="w-5 h-5 text-amber-400" />
                      </div>
                      <h3 className="text-white font-semibold">3. Administra Catalogos</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Personaliza los catalogos de plagas, enfermedades, tratamientos y sectores.
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <Bell className="w-5 h-5 text-red-400" />
                      </div>
                      <h3 className="text-white font-semibold">4. Revisa Alertas</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      El sistema te avisa si no hay registros en dias laborales y genera resumenes semanales.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Flujo de Trabajo Diario</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="bg-green-500/20 text-green-400 w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
                      <span className="text-gray-300">Recorre los sectores de tu cultivo</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-green-500/20 text-green-400 w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
                      <span className="text-gray-300">Si ves un problema, toma foto</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-green-500/20 text-green-400 w-8 h-8 rounded-full flex items-center justify-center font-bold">3</span>
                      <span className="text-gray-300">Crea registro en Bitacora: cultivo, sector, tipo de problema</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-green-500/20 text-green-400 w-8 h-8 rounded-full flex items-center justify-center font-bold">4</span>
                      <span className="text-gray-300">Indica severidad y tratamiento aplicado (si hay)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-green-500/20 text-green-400 w-8 h-8 rounded-full flex items-center justify-center font-bold">5</span>
                      <span className="text-gray-300">Guarda el registro</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alta de Cultivos */}
            {activeSection === 'cultivos' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-xl border border-blue-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <Sprout className="w-7 h-7 text-blue-400" />
                    Alta de Cultivos
                  </h2>
                  <p className="text-gray-400">
                    Registra los cultivos que tienes para poder vincularlos a los registros de bitacora.
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Campos del Formulario</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Ciclo y Anio</p>
                          <p className="text-gray-500 text-sm">Ej: 2024-1, 2024-2</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Cultivo y Variedad</p>
                          <p className="text-gray-500 text-sm">Selecciona del catalogo</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Sector</p>
                          <p className="text-gray-500 text-sm">Ubicacion dentro del rancho</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Fecha de Plantacion</p>
                          <p className="text-gray-500 text-sm">Cuando se planto</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Tipo de Suelo / Sustrato</p>
                          <p className="text-gray-500 text-sm">Caracteristicas del medio</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Sistema de Riego</p>
                          <p className="text-gray-500 text-sm">Goteo, aspersion, etc.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/cultivos"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Sprout className="w-5 h-5" />
                  Ir a Alta de Cultivos
                </Link>
              </div>
            )}

            {/* Bitacora */}
            {activeSection === 'bitacora' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl border border-purple-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <Camera className="w-7 h-7 text-purple-400" />
                    Bitacora de Campo
                  </h2>
                  <p className="text-gray-400">
                    Documenta los problemas que observas en campo con fotos y clasificacion.
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Tipos de Problemas</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                      <Bug className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-white text-sm font-medium">Plaga</p>
                    </div>
                    <div className="text-center p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                      <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                      <p className="text-white text-sm font-medium">Enfermedad</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                      <Leaf className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                      <p className="text-white text-sm font-medium">Nutricion</p>
                    </div>
                    <div className="text-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <Droplets className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-white text-sm font-medium">Riego</p>
                    </div>
                    <div className="text-center p-3 bg-gray-500/10 rounded-xl border border-gray-500/20">
                      <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-white text-sm font-medium">Otro</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Niveles de Severidad</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
                      <p className="text-green-400 font-bold">BAJA</p>
                      <p className="text-gray-500 text-xs mt-1">Problema menor</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-center">
                      <p className="text-yellow-400 font-bold">MEDIA</p>
                      <p className="text-gray-500 text-xs mt-1">Requiere atencion</p>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20 text-center">
                      <p className="text-orange-400 font-bold">ALTA</p>
                      <p className="text-gray-500 text-xs mt-1">Atender pronto</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-center">
                      <p className="text-red-400 font-bold">CRITICA</p>
                      <p className="text-gray-500 text-xs mt-1">Emergencia</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Como subir fotos desde el celular</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="bg-purple-500/20 text-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                      <span className="text-gray-300">Abre la pagina de Bitacora en tu celular</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-purple-500/20 text-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                      <span className="text-gray-300">Toca "Nuevo Registro"</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-purple-500/20 text-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                      <span className="text-gray-300">Toca el icono de camara para tomar o seleccionar foto</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-purple-500/20 text-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                      <span className="text-gray-300">Llena los demas campos y guarda</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/bitacora"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Ir a Bitacora
                </Link>
              </div>
            )}

            {/* Catalogos */}
            {activeSection === 'catalogos' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-xl border border-amber-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <Beaker className="w-7 h-7 text-amber-400" />
                    Catalogos
                  </h2>
                  <p className="text-gray-400">
                    Administra los catalogos del sistema para personalizar las opciones disponibles.
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Catalogos Disponibles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                      <Sprout className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">Cultivos</p>
                        <p className="text-gray-500 text-sm">Arandano, Frambuesa, Fresa, Zarzamora</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                      <Leaf className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="text-white font-medium">Variedades</p>
                        <p className="text-gray-500 text-sm">Variedades por cultivo</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">Sectores</p>
                        <p className="text-gray-500 text-sm">Sector A, Sector B, etc.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                      <Bug className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-white font-medium">Plagas</p>
                        <p className="text-gray-500 text-sm">Afidos, Acaros, Trips, etc.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="text-white font-medium">Enfermedades</p>
                        <p className="text-gray-500 text-sm">Botrytis, Oidio, Antracnosis, etc.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                      <Beaker className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-white font-medium">Tratamientos</p>
                        <p className="text-gray-500 text-sm">Productos con dosis recomendada</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/catalogos"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Beaker className="w-5 h-5" />
                  Ir a Catalogos
                </Link>
              </div>
            )}

            {/* Alertas */}
            {activeSection === 'alertas' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-red-500/20 to-pink-600/20 rounded-xl border border-red-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <Bell className="w-7 h-7 text-red-400" />
                    Alertas del Sistema
                  </h2>
                  <p className="text-gray-400">
                    El sistema genera alertas automaticas para mantenerte informado.
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Tipos de Alertas</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                      <Bell className="w-6 h-6 text-orange-400 mt-1" />
                      <div>
                        <p className="text-white font-medium">Alerta de Inactividad</p>
                        <p className="text-gray-400 text-sm">
                          Se genera de lunes a viernes si no hay registros en la bitacora ese dia.
                          Te ayuda a mantener la documentacion al dia.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <FileText className="w-6 h-6 text-blue-400 mt-1" />
                      <div>
                        <p className="text-white font-medium">Resumen Semanal</p>
                        <p className="text-gray-400 text-sm">
                          Cada semana se genera un resumen con el total de registros,
                          problemas por tipo, y dias con/sin actividad.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Como funcionan</h3>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-400" />
                      <span>Alertas diarias se verifican de lunes a viernes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Las alertas se pueden marcar como leidas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-green-400" />
                      <span>El badge en el menu muestra alertas pendientes</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/alertas"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  Ver Alertas
                </Link>
              </div>
            )}

            {/* FAQ */}
            <div className="mt-12 pt-8 border-t border-gray-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-green-400" />
                Preguntas Frecuentes
              </h2>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700/30 transition-colors"
                    >
                      <span className="text-white font-medium">{faq.question}</span>
                      {expandedFAQ === faq.id ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="px-4 pb-4">
                        <p className="text-gray-400 text-sm">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contacto */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mt-8">
              <h3 className="text-white font-semibold mb-2">Necesitas ayuda adicional?</h3>
              <p className="text-gray-400 text-sm">
                Contacta al administrador del sistema para resolver tus dudas o reportar problemas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// BerryVision AI - Ayuda e Instructivo
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  HelpCircle,
  Camera,
  Upload,
  Scan,
  Bot,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Map,
  Settings,
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronRight,
  Leaf,
  Bug,
  Droplets,
  Sparkles,
  MessageSquare,
  BookOpen,
  Play,
  Image as ImageIcon,
  MapPin,
  Zap,
  Sprout,
  Beaker,
  Database,
  Users,
  Building2,
  TreePine,
  FlaskConical,
  BarChart3,
  Bell,
  Calendar
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
}

const sections: Section[] = [
  { id: 'inicio', title: 'Primeros Pasos', icon: Play, color: 'text-green-400' },
  { id: 'estructura', title: 'Estructura de Datos', icon: Database, color: 'text-indigo-400' },
  { id: 'crecimiento', title: 'Seguimiento de Crecimiento', icon: Sprout, color: 'text-lime-400' },
  { id: 'laboratorio', title: 'Análisis de Laboratorio', icon: Beaker, color: 'text-amber-400' },
  { id: 'fotos', title: 'Capturar Fotos en Campo', icon: Camera, color: 'text-blue-400' },
  { id: 'analisis', title: 'Analizar con IA', icon: Scan, color: 'text-purple-400' },
  { id: 'plagas', title: 'Enfermedades y Plagas', icon: Bug, color: 'text-red-400' },
  { id: 'usuarios', title: 'Gestión de Usuarios', icon: Users, color: 'text-violet-400' },
  { id: 'notificaciones', title: 'Notificaciones', icon: Bell, color: 'text-pink-400' },
  { id: 'asistente', title: 'Asistente IA', icon: Bot, color: 'text-cyan-400' },
  { id: 'conocimiento', title: 'Base de Conocimiento', icon: BookOpen, color: 'text-yellow-400' },
  { id: 'reportes', title: 'Generar Reportes', icon: FileText, color: 'text-orange-400' },
  { id: 'mapa', title: 'Mapa de Calor', icon: Map, color: 'text-emerald-400' },
];

export default function AyudaPage() {
  const [activeSection, setActiveSection] = useState('inicio');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqs = [
    {
      id: 'faq1',
      question: '¿Cómo subo fotos desde mi celular?',
      answer: 'Usa la app móvil de BerryVision para tomar fotos en campo. Las fotos se sincronizan automáticamente cuando tengas conexión a internet. También puedes subir fotos manualmente desde la sección "Análisis" en el menú lateral.'
    },
    {
      id: 'faq2',
      question: '¿Qué tipos de plagas y enfermedades detecta?',
      answer: 'BerryVision detecta: Botrytis (moho gris), Antracnosis, Oídio, Momificación, Drosophila suzukii (SWD), Áfidos, Ácaros, Trips, y deficiencias nutricionales. El sistema se actualiza constantemente con nuevas detecciones.'
    },
    {
      id: 'faq3',
      question: '¿Cómo funciona el análisis con IA?',
      answer: 'GPT-4 Vision analiza tus fotos identificando enfermedades, plagas, estado fenológico y madurez de frutos. Luego, el sistema RAG busca información relevante en nuestra base de conocimiento agrícola para darte recomendaciones específicas de tratamiento.'
    },
    {
      id: 'faq4',
      question: '¿Puedo usar la app sin internet?',
      answer: 'Sí, la app móvil funciona offline. Puedes capturar fotos y agregar notas sin conexión. Todo se sincronizará automáticamente cuando recuperes la conexión.'
    },
    {
      id: 'faq5',
      question: '¿Cómo agrego información a la base de conocimiento?',
      answer: 'Ve a "Conocimiento" en el menú lateral. Ahí puedes agregar nuevos documentos sobre enfermedades, tratamientos, fenología, etc. Esta información se usa para mejorar las recomendaciones del sistema.'
    },
    {
      id: 'faq6',
      question: '¿Cómo registro un nuevo lote de plantación?',
      answer: 'Ve a "Crecimiento" → "Nuevo Lote". Selecciona el rancho, sector, variedad y fecha de plantación. El sistema generará automáticamente un código único (ej: LOT-BLU-2024-001) y vinculará todos los registros futuros a ese lote.'
    },
    {
      id: 'faq7',
      question: '¿Cómo cargo un análisis de laboratorio?',
      answer: 'Ve a "Laboratorio" → "Nuevo Análisis". Selecciona el tipo (suelo, foliar, agua, etc.), el lote al que corresponde, y llena los parámetros. La IA interpretará automáticamente los resultados comparando con los rangos óptimos para tu variedad.'
    },
    {
      id: 'faq8',
      question: '¿Cómo doy de alta a un ingeniero?',
      answer: 'Ve a "Configuración" → pestaña "Usuarios" → "Nuevo Usuario". Ingresa nombre, email, teléfono y selecciona el rol (Ingeniero de Campo, Supervisor o Admin). Activa las preferencias de notificación (Email/WhatsApp) para que reciba recordatorios.'
    },
    {
      id: 'faq9',
      question: '¿Cómo funcionan los recordatorios automáticos?',
      answer: 'De Lunes a Viernes a las 6 PM, el sistema detecta qué usuarios NO han subido información ese día y les envía un recordatorio por Email o WhatsApp según sus preferencias. Puedes enviar recordatorios manualmente desde Configuración → Notificaciones.'
    },
    {
      id: 'faq10',
      question: '¿Cómo recibo el reporte diario como admin?',
      answer: 'El reporte se genera automáticamente a las 8 PM y se envía al email configurado. Incluye: usuarios activos/inactivos, total de fotos subidas, registros de crecimiento, análisis de laboratorio y alertas generadas. También puedes verlo y enviarlo manualmente desde Configuración → Reportes.'
    }
  ];

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
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-emerald-400" />
                  Ayuda e Instructivo
                </h1>
                <p className="text-sm text-gray-400">
                  Guía completa para usar BerryVision AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de navegación */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-4">
              <h2 className="text-white font-semibold mb-4 px-3">Contenido</h2>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeSection === section.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <section.icon className={`w-4 h-4 ${section.color}`} />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3 space-y-8">
            {/* Primeros Pasos */}
            {activeSection === 'inicio' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl border border-emerald-500/20 p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <Leaf className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a BerryVision AI</h2>
                      <p className="text-gray-400">
                        Sistema integral de monitoreo y gestión de cultivos de berries.
                        Trazabilidad completa desde plantación hasta cosecha con inteligencia artificial.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Building2 className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="text-white font-semibold">1. Configura tu Rancho</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Define ranchos, sectores y bloques. Registra tus lotes de plantación con variedad específica.
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-lime-500/20 rounded-lg">
                        <Sprout className="w-5 h-5 text-lime-400" />
                      </div>
                      <h3 className="text-white font-semibold">2. Registra Crecimiento</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Sube fotos y mediciones de tus plantas. La IA analiza el estado de salud automáticamente.
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Beaker className="w-5 h-5 text-amber-400" />
                      </div>
                      <h3 className="text-white font-semibold">3. Carga Análisis de Lab</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Sube análisis de suelo, foliar, agua. El sistema compara con rangos óptimos por variedad.
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h3 className="text-white font-semibold">4. Monitorea y Actúa</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Recibe alertas, consulta al asistente IA y genera reportes profesionales.
                    </p>
                  </div>
                </div>

                {/* Variedades disponibles */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <TreePine className="w-5 h-5 text-green-400" />
                    Variedades Soportadas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-blue-400 font-medium mb-2">Arándano (30 variedades)</h4>
                      <p className="text-gray-400 text-sm mb-2">Bajo frío: Biloxi, Jewel, Emerald, Star, Snowchaser</p>
                      <p className="text-gray-400 text-sm mb-2">Medio frío: Legacy, Bluecrop, Duke, Draper, Liberty</p>
                      <p className="text-gray-400 text-sm">Premium: Sekoya, Rocío, Atlas, Titan, Top Shelf</p>
                    </div>
                    <div>
                      <h4 className="text-pink-400 font-medium mb-2">Frambuesa (30 variedades)</h4>
                      <p className="text-gray-400 text-sm mb-2">Primocane: Heritage, Polka, Maravilla, Himbo Top</p>
                      <p className="text-gray-400 text-sm mb-2">Floricane: Tulameen, Meeker, Glen Ample</p>
                      <p className="text-gray-400 text-sm">Premium: Kwanza, Kweli, Imara, Mapema</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estructura de Datos */}
            {activeSection === 'estructura' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-2xl border border-indigo-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Database className="w-7 h-7 text-indigo-400" />
                    Estructura de Datos
                  </h2>
                  <p className="text-gray-400">
                    El sistema usa una estructura jerárquica donde el LOTE es la unidad central de trazabilidad.
                  </p>
                </div>

                {/* Jerarquía */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-6">Jerarquía Organizacional</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Organización</p>
                        <p className="text-gray-400 text-sm">Empresa matriz que agrupa todos los ranchos</p>
                      </div>
                    </div>
                    <div className="ml-6 border-l-2 border-white/10 pl-10 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">Rancho</p>
                          <p className="text-gray-400 text-sm">Finca física con ubicación GPS, clima, certificaciones</p>
                        </div>
                      </div>
                      <div className="ml-6 border-l-2 border-white/10 pl-10 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Map className="w-4 h-4 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">Sector</p>
                            <p className="text-gray-400 text-sm">División por tipo de riego, orientación, suelo</p>
                          </div>
                        </div>
                        <div className="ml-6 border-l-2 border-white/10 pl-10 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                              <TreePine className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">Bloque</p>
                              <p className="text-gray-400 text-sm">Cuadro con filas y plantas por fila</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lote como unidad central */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl p-6 border border-emerald-500/20">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-emerald-400" />
                    LOTE DE PLANTACIÓN - Unidad Central
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Cada lote tiene un código único automático: <span className="text-emerald-400 font-mono">LOT-BLU-2024-001</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/5 p-3 rounded-lg text-center">
                      <Sprout className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Crecimiento</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg text-center">
                      <Beaker className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Análisis Lab</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg text-center">
                      <Camera className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Fotos</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg text-center">
                      <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Cosechas</p>
                    </div>
                  </div>
                </div>

                {/* Tablas principales */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Tablas Principales (35 tablas)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="text-indigo-400 font-medium mb-2">Estructura</h4>
                      <ul className="space-y-1 text-gray-400">
                        <li>• organizations, ranches, sectors, blocks</li>
                        <li>• crop_types, varieties (60+ variedades)</li>
                        <li>• planting_lots (lotes de plantación)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Seguimiento</h4>
                      <ul className="space-y-1 text-gray-400">
                        <li>• growth_records_v2 (registros crecimiento)</li>
                        <li>• harvest_records (cosechas)</li>
                        <li>• photos (fotos con análisis IA)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-amber-400 font-medium mb-2">Laboratorio</h4>
                      <ul className="space-y-1 text-gray-400">
                        <li>• soil_analyses, foliar_analyses</li>
                        <li>• water_analyses, fruit_quality_analyses</li>
                        <li>• pest_disease_analyses</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-cyan-400 font-medium mb-2">Manejo</h4>
                      <ul className="space-y-1 text-gray-400">
                        <li>• pruning_records, irrigation_records</li>
                        <li>• fertilization_records</li>
                        <li>• phytosanitary_records</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seguimiento de Crecimiento */}
            {activeSection === 'crecimiento' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-lime-500/10 to-green-500/10 rounded-2xl border border-lime-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Sprout className="w-7 h-7 text-lime-400" />
                    Seguimiento de Crecimiento
                  </h2>
                  <p className="text-gray-400">
                    Registra el desarrollo de tus plantas con fotos, mediciones y análisis IA automático.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Flujo de Trabajo</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <span className="bg-lime-500/20 text-lime-400 w-8 h-8 rounded-full flex items-center justify-center font-medium">1</span>
                      <div>
                        <p className="text-white font-medium">Crear Lote de Plantación</p>
                        <p className="text-gray-400 text-sm">Define rancho, sector, variedad y fecha. Código automático generado.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <span className="bg-lime-500/20 text-lime-400 w-8 h-8 rounded-full flex items-center justify-center font-medium">2</span>
                      <div>
                        <p className="text-white font-medium">Registrar Crecimiento</p>
                        <p className="text-gray-400 text-sm">Sube foto + mediciones: altura, brotes, flores, frutos.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <span className="bg-lime-500/20 text-lime-400 w-8 h-8 rounded-full flex items-center justify-center font-medium">3</span>
                      <div>
                        <p className="text-white font-medium">Análisis IA Automático</p>
                        <p className="text-gray-400 text-sm">GPT-4 Vision evalúa salud, detecta problemas, genera alertas.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <span className="bg-lime-500/20 text-lime-400 w-8 h-8 rounded-full flex items-center justify-center font-medium">4</span>
                      <div>
                        <p className="text-white font-medium">Correlación Ambiental</p>
                        <p className="text-gray-400 text-sm">El sistema relaciona con temperatura, humedad, riegos.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Datos que se Registran</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl mb-1">📏</p>
                      <p className="text-gray-300 text-sm">Altura (cm)</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl mb-1">🌿</p>
                      <p className="text-gray-300 text-sm">Brotes nuevos</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl mb-1">🌸</p>
                      <p className="text-gray-300 text-sm">Flores</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl mb-1">🫐</p>
                      <p className="text-gray-300 text-sm">Frutos</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl mb-1">💚</p>
                      <p className="text-gray-300 text-sm">Score Salud</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl mb-1">📸</p>
                      <p className="text-gray-300 text-sm">Fotos</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/crecimiento"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-lime-500 hover:bg-lime-600 rounded-xl text-black font-medium transition-colors"
                >
                  <Sprout className="w-5 h-5" />
                  Ir a Crecimiento
                </Link>
              </div>
            )}

            {/* Análisis de Laboratorio */}
            {activeSection === 'laboratorio' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Beaker className="w-7 h-7 text-amber-400" />
                    Análisis de Laboratorio
                  </h2>
                  <p className="text-gray-400">
                    Carga análisis de suelo, foliares, agua y más. La IA interpreta resultados y genera recomendaciones.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <FlaskConical className="w-5 h-5 text-amber-400" />
                      </div>
                      <h3 className="text-white font-semibold">Análisis de Suelo</h3>
                    </div>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• pH, CE, materia orgánica</li>
                      <li>• N, P, K, Ca, Mg, S</li>
                      <li>• Micronutrientes (Fe, Zn, Mn, Cu, B)</li>
                      <li>• Textura y CIC</li>
                    </ul>
                  </div>

                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Leaf className="w-5 h-5 text-green-400" />
                      </div>
                      <h3 className="text-white font-semibold">Análisis Foliar</h3>
                    </div>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• % N, P, K, Ca, Mg, S</li>
                      <li>• ppm Fe, Zn, Mn, Cu, B</li>
                      <li>• Por variedad y etapa fenológica</li>
                      <li>• Detección de deficiencias</li>
                    </ul>
                  </div>

                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Droplets className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-white font-semibold">Análisis de Agua</h3>
                    </div>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• pH, CE, SDT, dureza</li>
                      <li>• Cationes y aniones</li>
                      <li>• SAR, clasificación</li>
                      <li>• Apto para riego</li>
                    </ul>
                  </div>

                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-white font-semibold">Calidad de Fruta</h3>
                    </div>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Brix, pH, acidez</li>
                      <li>• Firmeza, calibre, peso</li>
                      <li>• % defectos</li>
                      <li>• Grado export/doméstico</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/20">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-cyan-400" />
                    Interpretación IA
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Al cargar un análisis, la IA automáticamente:
                  </p>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Compara contra rangos óptimos de tu variedad
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Identifica deficiencias y excesos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Correlaciona con registros de crecimiento
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Genera recomendaciones de fertilización
                    </li>
                  </ul>
                </div>

                <Link
                  href="/laboratorio"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl text-black font-medium transition-colors"
                >
                  <Beaker className="w-5 h-5" />
                  Ir a Laboratorio
                </Link>
              </div>
            )}

            {/* Capturar Fotos */}
            {activeSection === 'fotos' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl border border-blue-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Camera className="w-7 h-7 text-blue-400" />
                    Capturar Fotos en Campo
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Las fotos son la base del análisis. Sigue estas recomendaciones para obtener mejores resultados.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Consejos para tomar buenas fotos:</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Enfoca la planta o fruto afectado</p>
                        <p className="text-gray-400 text-sm">Acércate lo suficiente para que se vean los síntomas claramente.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Buena iluminación</p>
                        <p className="text-gray-400 text-sm">Preferiblemente luz natural, evita sombras fuertes y contraluz.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Incluye contexto</p>
                        <p className="text-gray-400 text-sm">Toma fotos del fruto, hojas y planta completa si es posible.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Vincula al lote correcto</p>
                        <p className="text-gray-400 text-sm">Asegúrate de seleccionar el lote de plantación al subir la foto.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-400" />
                    Uso de la App Móvil
                  </h3>
                  <ol className="space-y-3 text-gray-400">
                    <li className="flex items-start gap-3">
                      <span className="bg-blue-500/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
                      <span>Selecciona el <strong className="text-white">lote de plantación</strong> donde estás</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-blue-500/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
                      <span>Toma la foto usando el botón de cámara</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-blue-500/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
                      <span>Agrega mediciones (altura, brotes, etc.)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-blue-500/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">4</span>
                      <span>Guarda - la IA analizará automáticamente</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Analizar con IA */}
            {activeSection === 'analisis' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Scan className="w-7 h-7 text-purple-400" />
                    Analizar Fotos con IA
                  </h2>
                  <p className="text-gray-400">
                    El sistema utiliza GPT-4 Vision para analizar tus fotos y detectar problemas automáticamente.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">El análisis incluye:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span className="text-gray-300">Detección de enfermedades</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Bug className="w-5 h-5 text-orange-400" />
                      <span className="text-gray-300">Identificación de plagas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Leaf className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Estado fenológico (BBCH)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Droplets className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">Deficiencias nutricionales</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-300">Score de salud (0-100)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      <span className="text-gray-300">Recomendaciones específicas</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enfermedades y Plagas */}
            {activeSection === 'plagas' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl border border-red-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Bug className="w-7 h-7 text-red-400" />
                    Enfermedades y Plagas Detectables
                  </h2>
                  <p className="text-gray-400">
                    BerryVision puede identificar las principales amenazas a tus cultivos de berries.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      Enfermedades
                    </h3>
                    <ul className="space-y-2 text-gray-400 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        Botrytis (Moho Gris)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        Antracnosis (Colletotrichum)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        Oídio (Powdery Mildew)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        Momificación del fruto
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        Roya de la frambuesa
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        Phytophthora (pudrición raíz)
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Bug className="w-5 h-5 text-orange-400" />
                      Plagas
                    </h3>
                    <ul className="space-y-2 text-gray-400 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        Drosophila suzukii (SWD)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        Áfidos
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        Ácaros (Araña roja)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        Trips
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        Gusano de la frambuesa
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        Escarabajo japonés
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Gestión de Usuarios */}
            {activeSection === 'usuarios' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl border border-violet-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Users className="w-7 h-7 text-violet-400" />
                    Gestión de Usuarios
                  </h2>
                  <p className="text-gray-400">
                    Registra ingenieros y personal de campo. Configura sus preferencias de notificación y monitorea su actividad diaria.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Tipos de Usuario</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <span className="text-purple-400 font-medium">Administrador</span>
                      </div>
                      <p className="text-gray-400 text-sm">Acceso total al sistema. Recibe reportes diarios consolidados.</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span className="text-blue-400 font-medium">Supervisor</span>
                      </div>
                      <p className="text-gray-400 text-sm">Supervisa a ingenieros. Ve actividad de su equipo.</p>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-green-400 font-medium">Ingeniero de Campo</span>
                      </div>
                      <p className="text-gray-400 text-sm">Sube fotos, registros y análisis. Recibe recordatorios.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Cómo agregar un usuario</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <span className="bg-violet-500/20 text-violet-400 w-8 h-8 rounded-full flex items-center justify-center font-medium">1</span>
                      <div>
                        <p className="text-white font-medium">Ve a Configuración → Usuarios</p>
                        <p className="text-gray-400 text-sm">En el menú lateral, haz clic en &quot;Configuración&quot;</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <span className="bg-violet-500/20 text-violet-400 w-8 h-8 rounded-full flex items-center justify-center font-medium">2</span>
                      <div>
                        <p className="text-white font-medium">Clic en &quot;Nuevo Usuario&quot;</p>
                        <p className="text-gray-400 text-sm">Llena nombre, email, teléfono y rol</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <span className="bg-violet-500/20 text-violet-400 w-8 h-8 rounded-full flex items-center justify-center font-medium">3</span>
                      <div>
                        <p className="text-white font-medium">Configura notificaciones</p>
                        <p className="text-gray-400 text-sm">Activa Email y/o WhatsApp para recordatorios</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/configuracion"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 rounded-xl text-white font-medium transition-colors"
                >
                  <Users className="w-5 h-5" />
                  Ir a Configuración
                </Link>
              </div>
            )}

            {/* Notificaciones */}
            {activeSection === 'notificaciones' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-2xl border border-pink-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Bell className="w-7 h-7 text-pink-400" />
                    Sistema de Notificaciones
                  </h2>
                  <p className="text-gray-400">
                    Recordatorios automáticos para usuarios inactivos y reportes diarios para el administrador.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Bell className="w-5 h-5 text-orange-400" />
                      </div>
                      <h3 className="text-white font-semibold">Recordatorios Diarios</h3>
                    </div>
                    <ul className="text-gray-400 text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Lunes a Viernes a las 6:00 PM
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Solo a usuarios que NO subieron info hoy
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Por Email o WhatsApp según preferencia
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-white font-semibold">Reporte Diario Admin</h3>
                    </div>
                    <ul className="text-gray-400 text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Se genera a las 8:00 PM automático
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Resumen: activos, inactivos, registros
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Total fotos, análisis y alertas del día
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl p-6 border border-orange-500/20">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-400" />
                    ¿Cómo funciona?
                  </h3>
                  <div className="space-y-3 text-gray-400 text-sm">
                    <p>El sistema registra automáticamente cada vez que un usuario sube:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                      <div className="p-2 bg-white/5 rounded-lg text-center">
                        <Camera className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                        <span className="text-xs">Fotos</span>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg text-center">
                        <Sprout className="w-5 h-5 text-green-400 mx-auto mb-1" />
                        <span className="text-xs">Crecimiento</span>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg text-center">
                        <Beaker className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                        <span className="text-xs">Análisis Lab</span>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg text-center">
                        <Scan className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                        <span className="text-xs">Análisis IA</span>
                      </div>
                    </div>
                    <p className="mt-3">
                      Si al final del día (6 PM) un usuario no ha subido nada, recibe un recordatorio amigable.
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Envío Manual</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Desde Configuración → Notificaciones puedes:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm">
                      Ver usuarios inactivos hoy
                    </div>
                    <div className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm">
                      Enviar recordatorios manualmente
                    </div>
                    <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                      Ver reporte del día
                    </div>
                    <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                      Enviar reporte a admin
                    </div>
                  </div>
                </div>

                <Link
                  href="/configuracion"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-xl text-white font-medium transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  Ir a Notificaciones
                </Link>
              </div>
            )}

            {/* Asistente IA */}
            {activeSection === 'asistente' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Bot className="w-7 h-7 text-cyan-400" />
                    Asistente IA
                  </h2>
                  <p className="text-gray-400">
                    Pregunta cualquier cosa sobre tus cultivos. El asistente usa nuestra base de conocimiento agrícola para darte respuestas precisas.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Ejemplos de preguntas:</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <p className="text-cyan-400 text-sm">&quot;¿Cuál es el mejor momento para cosechar arándanos?&quot;</p>
                    </div>
                    <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <p className="text-cyan-400 text-sm">&quot;¿Cómo controlo la Botrytis en mis frambuesas?&quot;</p>
                    </div>
                    <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <p className="text-cyan-400 text-sm">&quot;Mi análisis foliar muestra bajo nitrógeno, ¿qué hago?&quot;</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/asistente"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-medium transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  Ir al Asistente IA
                </Link>
              </div>
            )}

            {/* Base de Conocimiento */}
            {activeSection === 'conocimiento' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-2xl border border-yellow-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <BookOpen className="w-7 h-7 text-yellow-400" />
                    Base de Conocimiento
                  </h2>
                  <p className="text-gray-400">
                    Agrega información técnica sobre cultivos, tratamientos y buenas prácticas.
                  </p>
                </div>

                <Link
                  href="/admin/conocimiento"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-xl text-black font-medium transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  Gestionar Conocimiento
                </Link>
              </div>
            )}

            {/* Reportes */}
            {activeSection === 'reportes' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <FileText className="w-7 h-7 text-orange-400" />
                    Generar Reportes
                  </h2>
                  <p className="text-gray-400">
                    Crea reportes profesionales para control y auditorías.
                  </p>
                </div>

                <Link
                  href="/reportes"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-medium transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Ir a Reportes
                </Link>
              </div>
            )}

            {/* Mapa de Calor */}
            {activeSection === 'mapa' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Map className="w-7 h-7 text-emerald-400" />
                    Mapa de Calor
                  </h2>
                  <p className="text-gray-400">
                    Visualiza la ubicación de problemas detectados en tu finca.
                  </p>
                </div>

                <Link
                  href="/mapa"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-colors"
                >
                  <Map className="w-5 h-5" />
                  Ver Mapa de Calor
                </Link>
              </div>
            )}

            {/* FAQ Section - Always visible */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-emerald-400" />
                Preguntas Frecuentes
              </h2>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between p-4 text-left"
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
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6 mt-8">
              <h3 className="text-white font-semibold mb-2">¿Necesitas más ayuda?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Contacta a soporte técnico o consulta al Asistente IA para resolver tus dudas.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/asistente"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  <Bot className="w-4 h-4" />
                  Preguntar al Asistente
                </Link>
                <a
                  href="mailto:soporte@berryvision.ai"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contactar Soporte
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

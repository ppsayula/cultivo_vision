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
  Zap
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
}

const sections: Section[] = [
  { id: 'inicio', title: 'Primeros Pasos', icon: Play, color: 'text-green-400' },
  { id: 'fotos', title: 'Capturar Fotos en Campo', icon: Camera, color: 'text-blue-400' },
  { id: 'analisis', title: 'Analizar con IA', icon: Scan, color: 'text-purple-400' },
  { id: 'plagas', title: 'Enfermedades y Plagas', icon: Bug, color: 'text-red-400' },
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
                        Sistema de monitoreo inteligente de cultivos de berries. Utiliza inteligencia artificial
                        para detectar enfermedades, plagas y optimizar tus cosechas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Smartphone className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-white font-semibold">1. Captura en Campo</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Usa tu celular para tomar fotos de tus plantas en el campo.
                      La app funciona sin internet.
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Zap className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-white font-semibold">2. Procesa con IA</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Ve a "Pendientes" y procesa las fotos con GPT-4 Vision para
                      obtener diagnósticos automáticos.
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <Bot className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h3 className="text-white font-semibold">3. Consulta al Asistente</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Pregunta cualquier duda sobre tratamientos, fenología o
                      manejo de cultivos al asistente IA.
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <FileText className="w-5 h-5 text-orange-400" />
                      </div>
                      <h3 className="text-white font-semibold">4. Genera Reportes</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Crea reportes diarios, semanales o mensuales con todos
                      los análisis y alertas detectadas.
                    </p>
                  </div>
                </div>
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
                        <p className="text-white font-medium">Agrega notas</p>
                        <p className="text-gray-400 text-sm">Describe lo que observas: olor, textura, extensión del daño.</p>
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
                      <span>Abre la app y selecciona el tipo de cultivo (arándano o frambuesa)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-blue-500/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
                      <span>Indica el sector o lote donde estás trabajando</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-blue-500/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
                      <span>Toma la foto usando el botón de cámara</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-blue-500/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">4</span>
                      <span>Agrega notas opcionales sobre lo que observas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-blue-500/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">5</span>
                      <span>La foto se guardará localmente y se sincronizará cuando tengas internet</span>
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
                  <h3 className="text-white font-semibold mb-4">Proceso de Análisis:</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">1. Ir a Pendientes</p>
                        <p className="text-gray-400 text-sm">Las fotos sincronizadas aparecen en la sección "Pendientes" del menú.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Zap className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">2. Procesar con IA</p>
                        <p className="text-gray-400 text-sm">Haz clic en "Procesar Todos" o analiza fotos individualmente.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">3. Revisar Resultados</p>
                        <p className="text-gray-400 text-sm">Ve el diagnóstico, estado de salud y recomendaciones de tratamiento.</p>
                      </div>
                    </div>
                  </div>
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
                      <span className="text-gray-300">Conteo de frutos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      <span className="text-gray-300">Madurez de cosecha</span>
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

                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-400" />
                    Deficiencias Nutricionales
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-400">
                    <span>Nitrógeno (N)</span>
                    <span>Hierro (Fe) - Clorosis</span>
                    <span>Magnesio (Mg)</span>
                    <span>Calcio (Ca)</span>
                    <span>Boro (B)</span>
                    <span>Potasio (K)</span>
                  </div>
                </div>
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
                      <p className="text-cyan-400 text-sm">"¿Cuál es el mejor momento para cosechar arándanos?"</p>
                    </div>
                    <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <p className="text-cyan-400 text-sm">"¿Cómo controlo la Botrytis en mis frambuesas?"</p>
                    </div>
                    <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <p className="text-cyan-400 text-sm">"¿Qué productos usar contra Drosophila suzukii?"</p>
                    </div>
                    <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <p className="text-cyan-400 text-sm">"¿Cuáles son los estados fenológicos del arándano?"</p>
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
                    Agrega información técnica sobre cultivos, tratamientos y buenas prácticas. Esta información alimenta al asistente IA.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Categorías de conocimiento:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-red-500/10 rounded-lg text-center">
                      <p className="text-red-400 text-sm font-medium">Enfermedades</p>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg text-center">
                      <p className="text-orange-400 text-sm font-medium">Plagas</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <p className="text-green-400 text-sm font-medium">Fenología</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                      <p className="text-blue-400 text-sm font-medium">Nutrición</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-lg text-center">
                      <p className="text-purple-400 text-sm font-medium">Tratamientos</p>
                    </div>
                    <div className="p-3 bg-cyan-500/10 rounded-lg text-center">
                      <p className="text-cyan-400 text-sm font-medium">Cosecha</p>
                    </div>
                  </div>
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
                    Crea reportes profesionales de tus análisis para llevar control y cumplir con auditorías.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Tipos de reportes:</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Operativo Diario</p>
                        <p className="text-gray-400 text-sm">Resumen de análisis del día para encargados de campo.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <FileText className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Gerencial Semanal</p>
                        <p className="text-gray-400 text-sm">Tendencias y comparativas para agrónomos y gerentes.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Ejecutivo Mensual</p>
                        <p className="text-gray-400 text-sm">KPIs consolidados para dirección e inversionistas.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <FileText className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Auditoría</p>
                        <p className="text-gray-400 text-sm">Trazabilidad completa para certificaciones.</p>
                      </div>
                    </div>
                  </div>
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
                    Visualiza la ubicación de problemas detectados en tu finca con un mapa interactivo.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Funcionalidades del mapa:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-red-400" />
                      <span className="text-gray-300">Ver ubicación exacta de cada análisis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <span className="text-gray-300">Identificar zonas con más alertas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Map className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Filtrar por tipo de problema</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">Ver historial por fecha</span>
                    </div>
                  </div>
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

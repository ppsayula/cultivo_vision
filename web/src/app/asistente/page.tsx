// Cultivo Vision - Asistente Agronómico con Claude
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Loader2,
  BookOpen,
  Leaf,
  Bug,
  Thermometer,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Camera,
  X,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  MapPin,
  Pill,
  Clock,
  Shield,
  Beaker,
} from 'lucide-react';

interface Protocol {
  id: string;
  problem_name: string;
  crop_type: string;
  severity: string;
  products: { nombre: string; ingrediente_activo: string; dosis: string; tipo: string }[];
  application_method: string;
  frequency: string;
  waiting_period_days: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  sources?: { id: string; title: string; category: string }[];
  protocols?: Protocol[];
  fieldContext?: {
    totalObservaciones: number;
    severidadDistribucion: Record<string, number>;
  };
  timestamp: Date;
}

interface Alert {
  problema: string;
  cultivo: string;
  severidad: string;
  count: number;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  baja: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  media: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  alta: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  critica: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

export default function AsistentePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string>('Frambuesa');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar alertas actuales al montar
  useEffect(() => {
    fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'alerts' }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.alerts) setAlerts(data.alerts);
      })
      .catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || (selectedImage ? 'Analiza esta imagen' : ''),
      imageUrl: imagePreview || undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    clearImage();
    setIsLoading(true);

    try {
      if (currentImage) {
        // Análisis de imagen - usa /api/rag (existente con GPT-4 Vision)
        const response = await fetch('/api/rag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze-image',
            image: currentImage,
            cropType: selectedCrop === 'Arándano' ? 'blueberry' : 'raspberry',
            additionalContext: currentInput || undefined,
          }),
        });
        const data = await response.json();

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.combinedResponse || data.error || 'No pude analizar la imagen. Verifica que la API de OpenAI esté configurada.',
          sources: data.ragEnhancement?.sources?.map((s: any) => ({ id: s.id, title: s.title, category: s.category })),
          timestamp: new Date(),
        }]);
      } else {
        // Consulta de texto - usa /api/assistant (Claude)
        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'query',
            question: currentInput,
            cropType: selectedCrop,
            sector: selectedSector || undefined,
          }),
        });
        const data = await response.json();

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer || data.error || 'No pude procesar tu consulta.',
          sources: data.sources,
          protocols: data.protocols,
          fieldContext: data.fieldContext,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error al procesar tu consulta. Verifica la conexión e intenta de nuevo.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  // Preguntas sugeridas dinámicas basadas en alertas reales
  const suggestedQuestions = alerts.length > 0
    ? alerts.slice(0, 4).map(a => ({
        icon: a.severidad === 'critica' ? AlertCircle : AlertTriangle,
        question: `¿Cómo controlar ${a.problema} en ${a.cultivo}? (${a.count} alertas ${a.severidad})`,
        category: a.severidad === 'critica' ? 'Urgente' : 'Alerta activa',
      }))
    : [
        { icon: Bug, question: '¿Cómo controlar Trips en frambuesa?', category: 'Plagas' },
        { icon: Leaf, question: '¿Cuál es el tratamiento para roya?', category: 'Enfermedades' },
        { icon: Thermometer, question: '¿Cómo corregir clorosis en frambuesa?', category: 'Nutrición' },
        { icon: Sparkles, question: '¿Qué programa de MIP recomiendas para berries?', category: 'Manejo' },
      ];

  return (
    <div className="flex flex-col h-full">
      {/* Selectores */}
      <div className="flex items-center justify-end gap-2 px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-800/50">
        <div className="relative">
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="appearance-none px-3 py-2 pr-8 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50 cursor-pointer"
          >
            <option value="Frambuesa">Frambuesa</option>
            <option value="Arándano">Arándano</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <input
            type="text"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            placeholder="Sector"
            className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {messages.length === 0 ? (
            <div className="space-y-8">
              {/* Welcome */}
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Agrónomo IA - Cultivo Vision
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Consulta diagnósticos, tratamientos y recomendaciones basadas en{' '}
                  <span className="text-green-400 font-medium">46 protocolos</span> y{' '}
                  <span className="text-green-400 font-medium">1,176 registros de campo</span>.
                </p>
              </div>

              {/* Stats badges */}
              <div className="flex justify-center gap-3 flex-wrap">
                <div className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-xs text-gray-400">
                  <Pill className="w-3 h-3 inline mr-1 text-green-400" /> 46 protocolos
                </div>
                <div className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-xs text-gray-400">
                  <BookOpen className="w-3 h-3 inline mr-1 text-blue-400" /> 22 docs de conocimiento
                </div>
                <div className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-xs text-gray-400">
                  <MapPin className="w-3 h-3 inline mr-1 text-amber-400" /> 1,176 registros de campo
                </div>
              </div>

              {/* Suggested Questions */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center">
                  {alerts.length > 0 ? 'Alertas activas del rancho' : 'Preguntas sugeridas'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedQuestions.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(item.question)}
                        className="flex items-start gap-3 p-4 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 hover:border-green-500/30 rounded-xl text-left transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                          <Icon className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm">{item.question}</p>
                          <p className="text-gray-500 text-xs mt-1">{item.category}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[90%] ${
                    message.role === 'user'
                      ? 'bg-green-500/20 border-green-500/30'
                      : 'bg-gray-800/30 border-gray-700/30'
                  } border rounded-2xl p-4`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Agrónomo IA</span>
                      </div>
                    )}

                    {/* User image */}
                    {message.imageUrl && (
                      <div className="mb-3">
                        <img src={message.imageUrl} alt="Imagen enviada" className="rounded-lg max-h-48 object-cover" />
                      </div>
                    )}

                    {/* Field context badge */}
                    {message.fieldContext && (
                      <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-400 text-xs font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Respaldado por {message.fieldContext.totalObservaciones} observaciones de campo
                        </p>
                        <div className="flex gap-2 mt-1">
                          {Object.entries(message.fieldContext.severidadDistribucion).map(([sev, count]) => {
                            const colors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.media;
                            return (
                              <span key={sev} className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                {sev}: {count}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Message content */}
                    <div className="text-white whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>

                    {/* Treatment Protocols */}
                    {message.protocols && message.protocols.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-gray-400 text-xs font-medium flex items-center gap-1">
                          <Pill className="w-3 h-3" /> Protocolos de tratamiento
                        </p>
                        {message.protocols.map((protocol) => {
                          const colors = SEVERITY_COLORS[protocol.severity] || SEVERITY_COLORS.media;
                          return (
                            <div key={protocol.id} className={`p-3 rounded-xl border ${colors.border} ${colors.bg}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-semibold ${colors.text}`}>
                                  {protocol.problem_name} - {protocol.crop_type}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                                  {protocol.severity}
                                </span>
                              </div>
                              {/* Products table */}
                              <div className="space-y-1 mb-2">
                                {protocol.products.map((prod, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <Beaker className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="text-white font-medium">{prod.nombre}</span>
                                    <span className="text-gray-500">({prod.ingrediente_activo})</span>
                                    <span className="text-green-400 ml-auto">{prod.dosis}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {protocol.frequency}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Shield className="w-3 h-3" /> Carencia: {protocol.waiting_period_days}d
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-700/30">
                        <p className="text-gray-500 text-xs mb-2">Fuentes:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((source, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded-lg text-gray-400 text-xs">
                              <ExternalLink className="w-3 h-3" />
                              {source.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-gray-600 text-xs mt-2">
                      {message.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                      <span className="text-gray-400 text-sm">
                        Consultando base de conocimiento y protocolos...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <div className="sticky bottom-0 backdrop-blur-xl border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img src={imagePreview} alt="Vista previa" className="h-20 rounded-lg object-cover border border-gray-700" />
              <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors disabled:opacity-50"
              title="Subir imagen para análisis"
            >
              <Camera className="w-5 h-5 text-gray-400" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedImage ? 'Agrega contexto (opcional)...' : '¿Qué problema observas en campo?'}
              className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </form>
          <p className="text-center text-gray-600 text-xs mt-3">
            Agrónomo IA con Claude - 46 protocolos + 22 docs + 1,176 registros de campo
          </p>
        </div>
      </div>
    </div>
  );
}

// BerryVision AI - Asistente de Conocimiento con Análisis de Imágenes
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
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
  ImageIcon,
  X,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  analysis?: {
    health_status: 'healthy' | 'alert' | 'critical';
    disease?: { name: string; confidence: number } | null;
    pest?: { name: string; confidence: number } | null;
    phenology_bbch?: number;
    fruit_count?: number;
  };
  sources?: {
    id: string;
    title: string;
    category: string;
  }[];
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  {
    icon: Bug,
    question: '¿Cómo controlar Drosophila suzukii en arándanos?',
    category: 'Plagas',
  },
  {
    icon: Leaf,
    question: '¿Cuáles son los síntomas de Botrytis en berries?',
    category: 'Enfermedades',
  },
  {
    icon: Thermometer,
    question: '¿Cómo identificar deficiencias de hierro?',
    category: 'Nutrición',
  },
  {
    icon: Sparkles,
    question: '¿Cuál es el momento óptimo de cosecha?',
    category: 'Cosecha',
  },
];

const HEALTH_STATUS_CONFIG = {
  healthy: {
    label: 'Saludable',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    icon: CheckCircle,
  },
  alert: {
    label: 'Alerta',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    icon: AlertTriangle,
  },
  critical: {
    label: 'Crítico',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    icon: AlertCircle,
  },
};

export default function AsistentePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<'blueberry' | 'raspberry'>('blueberry');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    clearImage();
    setIsLoading(true);

    try {
      let response;
      let data;

      if (currentImage) {
        // Image analysis with RAG
        response = await fetch('/api/rag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze-image',
            image: currentImage,
            cropType: selectedCrop,
            additionalContext: currentInput || undefined,
          }),
        });

        data = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.combinedResponse || data.analysis?.recommendation || 'No pude analizar la imagen.',
          analysis: data.analysis,
          sources: data.ragEnhancement?.sources?.map((s: any) => ({
            id: s.id,
            title: s.title,
            category: s.category,
          })),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Text query with RAG
        response = await fetch('/api/rag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'query',
            question: currentInput,
            context: {
              cropType: selectedCrop,
            },
          }),
        });

        data = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer || 'No pude procesar tu consulta.',
          sources: data.sources?.map((s: any) => ({
            id: s.id,
            title: s.title,
            category: s.category,
          })),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu consulta. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                  <Bot className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Asistente BerryVision</h1>
                  <p className="text-sm text-gray-400">
                    Base de conocimiento agrícola
                  </p>
                </div>
              </div>
            </div>

            {/* Crop Selector */}
            <div className="relative">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value as any)}
                className="appearance-none px-4 py-2 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="blueberry">🫐 Arándano</option>
                <option value="raspberry">🍇 Frambuesa</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {messages.length === 0 ? (
            <div className="space-y-8">
              {/* Welcome */}
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Base de Conocimiento BerryVision
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Consulta información técnica sobre enfermedades, plagas,
                  nutrición, fenología y mejores prácticas para el cultivo de
                  berries.
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center">
                  Preguntas sugeridas
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SUGGESTED_QUESTIONS.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(item.question)}
                        className="flex items-start gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                          <Icon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm">{item.question}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {item.category}
                          </p>
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
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-emerald-500/20 border-emerald-500/30'
                        : 'bg-white/5 border-white/10'
                    } border rounded-2xl p-4`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 text-sm font-medium">
                          Asistente
                        </span>
                      </div>
                    )}

                    {/* User image */}
                    {message.imageUrl && (
                      <div className="mb-3">
                        <img
                          src={message.imageUrl}
                          alt="Imagen enviada"
                          className="rounded-lg max-h-48 object-cover"
                        />
                      </div>
                    )}

                    {/* Analysis badge */}
                    {message.analysis && (
                      <div className="mb-3 space-y-2">
                        {/* Health status */}
                        {(() => {
                          const status = HEALTH_STATUS_CONFIG[message.analysis.health_status];
                          const StatusIcon = status.icon;
                          return (
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${status.bgColor} ${status.borderColor} border`}>
                              <StatusIcon className={`w-4 h-4 ${status.color}`} />
                              <span className={`text-sm font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                          );
                        })()}

                        {/* Detection badges */}
                        <div className="flex flex-wrap gap-2">
                          {message.analysis.disease?.name && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
                              <Bug className="w-3 h-3 text-red-400" />
                              <span className="text-xs text-red-400">
                                {message.analysis.disease.name} ({message.analysis.disease.confidence}%)
                              </span>
                            </div>
                          )}
                          {message.analysis.pest?.name && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                              <Bug className="w-3 h-3 text-orange-400" />
                              <span className="text-xs text-orange-400">
                                {message.analysis.pest.name} ({message.analysis.pest.confidence}%)
                              </span>
                            </div>
                          )}
                          {message.analysis.phenology_bbch !== undefined && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                              <Leaf className="w-3 h-3 text-blue-400" />
                              <span className="text-xs text-blue-400">
                                BBCH {message.analysis.phenology_bbch}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-white whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <p className="text-gray-500 text-xs mb-2">Fuentes:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((source, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-gray-400 text-xs"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {source.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-gray-500 text-xs mt-2">
                      {message.timestamp.toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                      <span className="text-gray-400 text-sm">
                        Buscando en la base de conocimiento...
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
      <div className="sticky bottom-0 bg-[#0a0a0f]/80 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Vista previa"
                className="h-20 rounded-lg object-cover border border-white/20"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Image upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors disabled:opacity-50"
              title="Subir imagen para análisis"
            >
              <Camera className="w-5 h-5 text-gray-400" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedImage ? "Agrega contexto (opcional)..." : "Pregunta o sube una imagen..."}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </form>
          <p className="text-center text-gray-600 text-xs mt-3">
            📷 Sube una foto de tu cultivo para análisis visual con IA + base de conocimiento.
          </p>
        </div>
      </div>
    </div>
  );
}

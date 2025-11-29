// BerryVision AI - Asistente de Conocimiento
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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

export default function AsistentePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<'blueberry' | 'raspberry'>('blueberry');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query',
          question: userMessage.content,
          context: {
            cropType: selectedCrop,
          },
        }),
      });

      const data = await response.json();

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
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre enfermedades, plagas, nutrición..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
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
            Las respuestas se basan en la base de conocimiento de BerryVision.
            Siempre consulte con un agrónomo certificado para decisiones críticas.
          </p>
        </div>
      </div>
    </div>
  );
}

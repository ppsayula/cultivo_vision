'use client';

import Link from 'next/link';
import { Upload, GraduationCap, Database, Pill, BookOpen, Microscope, Bot } from 'lucide-react';

interface FeatureCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ href, icon, title, description, color }: FeatureCardProps) {
  return (
    <Link href={href}>
      <div className={`group relative bg-gradient-to-br ${color} rounded-2xl border border-white/10 p-6 hover:scale-105 transition-all duration-300 hover:border-white/20 cursor-pointer h-full`}>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-300 text-sm">{description}</p>
          </div>
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

export default function LabDashboard() {
  const features = [
    {
      href: '/upload',
      icon: <Upload className="w-8 h-8 text-blue-400" />,
      title: 'Análisis Manual',
      description: 'Sube y analiza fotos individuales de cultivos',
      color: 'from-blue-500/10 to-blue-600/10',
    },
    {
      href: '/entrenar',
      icon: <GraduationCap className="w-8 h-8 text-purple-400" />,
      title: 'Entrenar AI',
      description: 'Etiqueta imágenes para mejorar la precisión del modelo',
      color: 'from-purple-500/10 to-purple-600/10',
    },
    {
      href: '/dataset',
      icon: <Database className="w-8 h-8 text-emerald-400" />,
      title: 'Dataset',
      description: 'Visualiza y exporta el dataset de entrenamiento',
      color: 'from-emerald-500/10 to-emerald-600/10',
    },
    {
      href: '/recetas',
      icon: <Pill className="w-8 h-8 text-rose-400" />,
      title: 'Recetas de Control',
      description: 'Tratamientos y control de enfermedades y plagas',
      color: 'from-rose-500/10 to-rose-600/10',
    },
    {
      href: '/conocimiento',
      icon: <BookOpen className="w-8 h-8 text-amber-400" />,
      title: 'Base de Conocimiento',
      description: 'Gestiona información agrícola y mejores prácticas',
      color: 'from-amber-500/10 to-amber-600/10',
    },
    {
      href: '/laboratorio',
      icon: <Microscope className="w-8 h-8 text-cyan-400" />,
      title: 'Laboratorio',
      description: 'Análisis detallado y comparaciones avanzadas',
      color: 'from-cyan-500/10 to-cyan-600/10',
    },
    {
      href: '/asistente',
      icon: <Bot className="w-8 h-8 text-indigo-400" />,
      title: 'Asistente IA',
      description: 'Chat con experto agrícola basado en IA',
      color: 'from-indigo-500/10 to-indigo-600/10',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                BerryVision Lab
              </h1>
              <p className="text-gray-400">
                Centro de Gestión y Entrenamiento de IA
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-emerald-400 text-sm font-medium">
                  Puerto 3001
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Info Banner */}
        <div className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Microscope className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Bienvenido al Laboratorio
              </h2>
              <p className="text-gray-300 mb-3">
                Esta aplicación está diseñada para agrónomos, administradores e investigadores.
                Aquí puedes entrenar el modelo de IA, gestionar recetas de control y administrar
                la base de conocimiento del sistema.
              </p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-gray-400">Entrenamiento AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-gray-400">Gestión de Conocimiento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-gray-400">Control de Plagas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.href} {...feature} />
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-white font-semibold mb-2">Entrenar AI</h3>
              <p className="text-gray-400 text-sm">
                Etiqueta imágenes manualmente para crear un dataset de entrenamiento
                que mejore la precisión del modelo.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Recetas de Control</h3>
              <p className="text-gray-400 text-sm">
                Gestiona tratamientos específicos para diferentes enfermedades
                y plagas detectadas en los cultivos.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Base de Conocimiento</h3>
              <p className="text-gray-400 text-sm">
                Administra información agrícola que el asistente de IA utiliza
                para proporcionar respuestas precisas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

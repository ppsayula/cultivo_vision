'use client';

import Link from 'next/link';
import { ArrowLeft, Microscope } from 'lucide-react';

export default function LaboratorioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Laboratorio</h1>
            <p className="text-gray-400 mt-1">Análisis detallado y comparaciones avanzadas</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 rounded-2xl border border-cyan-500/20 p-12 text-center">
          <Microscope className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Próximamente</h2>
          <p className="text-gray-300 max-w-md mx-auto">
            Esta sección permitirá realizar análisis detallados, comparaciones
            entre imágenes y pruebas avanzadas del modelo de IA.
          </p>
        </div>
      </div>
    </div>
  );
}

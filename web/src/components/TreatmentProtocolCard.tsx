// Cultivo Vision - Treatment Protocol Card
// Componente reutilizable para mostrar protocolos de tratamiento

'use client';

import {
  Pill,
  Clock,
  AlertTriangle,
  Shield,
  Leaf,
  Beaker,
  ChevronDown,
  ChevronUp,
  Droplets,
} from 'lucide-react';
import { useState } from 'react';

interface Product {
  nombre: string;
  ingrediente_activo: string;
  dosis: string;
  tipo: string;
}

interface Protocol {
  id?: string;
  problem_name: string;
  crop_type: string;
  severity: string;
  products: Product[];
  application_method: string;
  frequency: string;
  waiting_period_days: number;
  prevention_steps?: string[];
  cultural_controls?: string[];
  biological_controls?: string[];
  notes?: string;
}

interface FieldContextData {
  totalObservaciones: number;
  severidadDistribucion: Record<string, number>;
  sectoresAfectados: string[];
  tratamientosUsados: { producto: string; dosis: string; count: number }[];
}

interface Props {
  protocol: Protocol;
  fieldContext?: FieldContextData | null;
  urgency?: 'normal' | 'urgente' | 'critico';
  showDetails?: boolean;
  compact?: boolean;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  baja: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: 'BAJA' },
  media: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'MEDIA' },
  alta: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', label: 'ALTA' },
  critica: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'CRÍTICA' },
};

const URGENCY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  normal: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '✓' },
  urgente: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: '⚠' },
  critico: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '🚨' },
};

export default function TreatmentProtocolCard({
  protocol,
  fieldContext,
  urgency = 'normal',
  showDetails = true,
  compact = false,
}: Props) {
  const [expanded, setExpanded] = useState(!compact);
  const sev = SEVERITY_STYLES[protocol.severity] || SEVERITY_STYLES.media;
  const urg = URGENCY_STYLES[urgency];

  return (
    <div className={`rounded-xl border ${sev.border} bg-gray-800/50 overflow-hidden`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 ${sev.bg} cursor-pointer`}
        onClick={() => compact && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-5 h-5 ${sev.text}`} />
          <div>
            <h3 className="font-semibold text-white text-sm">
              {protocol.problem_name}
              <span className="text-gray-400 font-normal ml-2">en {protocol.crop_type}</span>
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {urgency !== 'normal' && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urg.bg} ${urg.text}`}>
              {urg.icon} {urgency === 'critico' ? 'CRÍTICO' : 'URGENTE'}
            </span>
          )}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
            {sev.label}
          </span>
          {compact && (expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Products Table */}
          {protocol.products?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Pill className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Productos</span>
              </div>
              <div className="bg-gray-900/50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      <th className="text-left px-3 py-2 text-gray-400 font-medium">Producto</th>
                      <th className="text-left px-3 py-2 text-gray-400 font-medium">Ingrediente Activo</th>
                      <th className="text-left px-3 py-2 text-gray-400 font-medium">Dosis</th>
                      <th className="text-left px-3 py-2 text-gray-400 font-medium">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {protocol.products.map((prod, i) => (
                      <tr key={i} className="border-b border-gray-800/50 last:border-0">
                        <td className="px-3 py-2 text-white font-medium">{prod.nombre}</td>
                        <td className="px-3 py-2 text-gray-300">{prod.ingrediente_activo}</td>
                        <td className="px-3 py-2 text-green-400 font-mono text-xs">{prod.dosis}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-300">
                            {prod.tipo}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Application Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2 bg-gray-900/30 rounded-lg px-3 py-2">
              <Droplets className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Método</p>
                <p className="text-sm text-white">{protocol.application_method}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-gray-900/30 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Frecuencia</p>
                <p className="text-sm text-white">{protocol.frequency}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-gray-900/30 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Periodo de carencia</p>
                <p className="text-sm text-white font-semibold">{protocol.waiting_period_days} días</p>
              </div>
            </div>
          </div>

          {/* Extended Details */}
          {showDetails && (
            <>
              {/* Prevention */}
              {protocol.prevention_steps && protocol.prevention_steps.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Prevención</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {protocol.prevention_steps.map((step, i) => (
                      <li key={i} className="text-sm text-gray-300 list-disc">{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cultural Controls */}
              {protocol.cultural_controls && protocol.cultural_controls.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Leaf className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Control Cultural</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {protocol.cultural_controls.map((ctrl, i) => (
                      <li key={i} className="text-sm text-gray-300 list-disc">{ctrl}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Biological Controls */}
              {protocol.biological_controls && protocol.biological_controls.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Beaker className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">Control Biológico</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {protocol.biological_controls.map((ctrl, i) => (
                      <li key={i} className="text-sm text-gray-300 list-disc">{ctrl}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {protocol.notes && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                  <p className="text-sm text-yellow-300">
                    <span className="font-medium">Nota:</span> {protocol.notes}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Field Context */}
          {fieldContext && (
            <div className="border-t border-gray-700/50 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Beaker className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">Datos de Campo (Lola Berries)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-gray-900/30 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg font-bold text-white">{fieldContext.totalObservaciones}</p>
                  <p className="text-xs text-gray-400">Observaciones</p>
                </div>
                {Object.entries(fieldContext.severidadDistribucion).map(([sev, count]) => {
                  const s = SEVERITY_STYLES[sev] || SEVERITY_STYLES.media;
                  return (
                    <div key={sev} className={`rounded-lg px-3 py-2 text-center ${s.bg}`}>
                      <p className={`text-lg font-bold ${s.text}`}>{count}</p>
                      <p className="text-xs text-gray-400">{sev}</p>
                    </div>
                  );
                })}
              </div>
              {fieldContext.sectoresAfectados.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Sectores: {fieldContext.sectoresAfectados.join(', ')}
                </p>
              )}
              {fieldContext.tratamientosUsados.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Tratamientos aplicados en campo:</p>
                  <div className="flex flex-wrap gap-1">
                    {fieldContext.tratamientosUsados.map((t, i) => (
                      <span key={i} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-full">
                        {t.producto} {t.dosis ? `(${t.dosis})` : ''} × {t.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

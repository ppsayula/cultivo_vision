// Cultivo Vision - Protocol Resolver
// Dado (problema, severidad, cultivo) → protocolo completo con contexto historico

import { searchProtocols, getFieldContext, TreatmentProtocol, FieldContext } from './rag-claude';

export interface ResolvedProtocol {
  primary: TreatmentProtocol;
  alternatives: TreatmentProtocol[];
  fieldContext: FieldContext | null;
  urgency: 'normal' | 'urgente' | 'critico';
  summary: string;
}

// Catalog of problems for the diagnostic selector
export interface ProblemCatalogEntry {
  problem_type: 'plaga' | 'enfermedad' | 'nutricion';
  problem_name: string;
  crop_type: string;
  severities: string[];
}

// Static catalog derived from treatment_protocols
export const PROBLEM_CATALOG: ProblemCatalogEntry[] = [
  // Plagas
  { problem_type: 'plaga', problem_name: 'Trips', crop_type: 'Frambuesa', severities: ['baja', 'media', 'alta'] },
  { problem_type: 'plaga', problem_name: 'Trips', crop_type: 'Arándano', severities: ['media'] },
  { problem_type: 'plaga', problem_name: 'Gusano', crop_type: 'Frambuesa', severities: ['baja', 'media', 'alta'] },
  { problem_type: 'plaga', problem_name: 'Chicharrita', crop_type: 'Frambuesa', severities: ['baja', 'media', 'alta'] },
  { problem_type: 'plaga', problem_name: 'Ácaro', crop_type: 'Frambuesa', severities: ['baja', 'media', 'alta'] },
  { problem_type: 'plaga', problem_name: 'Araña roja', crop_type: 'Frambuesa', severities: ['media', 'alta'] },
  { problem_type: 'plaga', problem_name: 'Pulgón', crop_type: 'Frambuesa', severities: ['baja', 'media', 'alta'] },
  { problem_type: 'plaga', problem_name: 'Mosca blanca', crop_type: 'Frambuesa', severities: ['baja', 'media'] },
  { problem_type: 'plaga', problem_name: 'Drosophila suzukii', crop_type: 'Frambuesa', severities: ['media', 'alta'] },
  { problem_type: 'plaga', problem_name: 'Mayate', crop_type: 'Frambuesa', severities: ['media'] },
  { problem_type: 'plaga', problem_name: 'Chinche', crop_type: 'Frambuesa', severities: ['media'] },
  { problem_type: 'plaga', problem_name: 'Minador de la hoja', crop_type: 'Frambuesa', severities: ['media'] },
  { problem_type: 'plaga', problem_name: 'Mosca del fruto', crop_type: 'Frambuesa', severities: ['media'] },
  // Enfermedades
  { problem_type: 'enfermedad', problem_name: 'Botrytis', crop_type: 'Frambuesa', severities: ['baja', 'media', 'alta'] },
  { problem_type: 'enfermedad', problem_name: 'Botrytis', crop_type: 'Arándano', severities: ['media'] },
  { problem_type: 'enfermedad', problem_name: 'Cenicilla', crop_type: 'Frambuesa', severities: ['baja', 'media', 'alta'] },
  { problem_type: 'enfermedad', problem_name: 'Cenicilla', crop_type: 'Arándano', severities: ['media'] },
  { problem_type: 'enfermedad', problem_name: 'Roya', crop_type: 'Frambuesa', severities: ['baja', 'media', 'alta'] },
  { problem_type: 'enfermedad', problem_name: 'Fusarium / Phytophthora', crop_type: 'Frambuesa', severities: ['alta'] },
  { problem_type: 'enfermedad', problem_name: 'Muerte regresiva', crop_type: 'Frambuesa', severities: ['alta'] },
  { problem_type: 'enfermedad', problem_name: 'Antracnosis', crop_type: 'Frambuesa', severities: ['media'] },
  { problem_type: 'enfermedad', problem_name: 'Alternaria', crop_type: 'Frambuesa', severities: ['media'] },
  { problem_type: 'enfermedad', problem_name: 'Clorosis', crop_type: 'Frambuesa', severities: ['media'] },
  { problem_type: 'enfermedad', problem_name: 'Damping off', crop_type: 'Frambuesa', severities: ['media'] },
  { problem_type: 'enfermedad', problem_name: 'Didymella', crop_type: 'Frambuesa', severities: ['media'] },
  { problem_type: 'enfermedad', problem_name: 'Fumagina', crop_type: 'Frambuesa', severities: ['media'] },
  // Nutricion
  { problem_type: 'nutricion', problem_name: 'Deficiencia nutricional general', crop_type: 'Frambuesa', severities: ['media'] },
];

// Get unique crop types from catalog
export function getAvailableCrops(): string[] {
  return [...new Set(PROBLEM_CATALOG.map(p => p.crop_type))].sort();
}

// Get problem types available for a crop
export function getAvailableTypes(cropType?: string): string[] {
  const filtered = cropType
    ? PROBLEM_CATALOG.filter(p => p.crop_type === cropType)
    : PROBLEM_CATALOG;
  return [...new Set(filtered.map(p => p.problem_type))].sort();
}

// Get problems available for a crop + type
export function getAvailableProblems(cropType?: string, problemType?: string): ProblemCatalogEntry[] {
  return PROBLEM_CATALOG.filter(p => {
    if (cropType && p.crop_type !== cropType) return false;
    if (problemType && p.problem_type !== problemType) return false;
    return true;
  });
}

// Get severities for a specific problem + crop
export function getAvailableSeverities(problemName: string, cropType: string): string[] {
  const entry = PROBLEM_CATALOG.find(
    p => p.problem_name === problemName && p.crop_type === cropType
  );
  return entry?.severities || ['baja', 'media', 'alta'];
}

// Main resolver: problem + severity + crop → full protocol with context
export async function resolveProtocol(
  problemName: string,
  cropType: string,
  severity?: string
): Promise<ResolvedProtocol | null> {
  // Search protocols matching the problem
  const protocols = await searchProtocols(problemName, {
    cropType,
    severity,
  });

  if (protocols.length === 0) {
    // Try broader search without severity
    const broader = await searchProtocols(problemName, { cropType });
    if (broader.length === 0) return null;

    // Use the closest severity match
    const primary = broader[0];
    return {
      primary,
      alternatives: broader.slice(1),
      fieldContext: await getFieldContext(problemName, { cropType }),
      urgency: getUrgency(primary.severity),
      summary: buildSummary(primary, broader.length - 1),
    };
  }

  const primary = protocols[0];
  const alternatives = protocols.slice(1);
  const fieldContext = await getFieldContext(problemName, { cropType });

  return {
    primary,
    alternatives,
    fieldContext,
    urgency: getUrgency(severity || primary.severity),
    summary: buildSummary(primary, alternatives.length, fieldContext),
  };
}

function getUrgency(severity: string): 'normal' | 'urgente' | 'critico' {
  if (severity === 'critica') return 'critico';
  if (severity === 'alta') return 'urgente';
  return 'normal';
}

function buildSummary(
  protocol: TreatmentProtocol,
  altCount: number,
  fieldContext?: FieldContext | null
): string {
  const parts: string[] = [];
  parts.push(`${protocol.problem_name} en ${protocol.crop_type} - Severidad ${protocol.severity.toUpperCase()}`);

  if (protocol.products?.length) {
    parts.push(`Producto principal: ${protocol.products[0].nombre} (${protocol.products[0].dosis})`);
  }

  if (altCount > 0) {
    parts.push(`${altCount} protocolo(s) alternativo(s) disponible(s)`);
  }

  if (fieldContext) {
    parts.push(`${fieldContext.totalObservaciones} observaciones de campo registradas`);
  }

  return parts.join('. ');
}

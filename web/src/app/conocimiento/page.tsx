// Cultivo Vision - Portal de Conocimiento Agronomico
// Navega documentos por categoria + protocolos de tratamiento
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Bug,
  Droplets,
  Leaf,
  Pill,
  Search,
  Beaker,
  Sprout,
  ChevronRight,
  ChevronDown,
  FileText,
  Shield,
  Clock,
  Loader2,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import TreatmentProtocolCard from '@/components/TreatmentProtocolCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Category config
const CATEGORIES: Record<string, { label: string; icon: typeof Bug; color: string; description: string }> = {
  pest: { label: 'Plagas', icon: Bug, color: 'text-red-400', description: 'Insectos y acaros que danan los cultivos' },
  disease: { label: 'Enfermedades', icon: Droplets, color: 'text-purple-400', description: 'Hongos, bacterias y virus' },
  treatment: { label: 'Tratamientos', icon: Pill, color: 'text-green-400', description: 'Productos y protocolos de aplicacion' },
  nutrition: { label: 'Nutricion', icon: Beaker, color: 'text-yellow-400', description: 'Manejo nutricional y fertilizacion' },
  best_practice: { label: 'Buenas Practicas', icon: Shield, color: 'text-blue-400', description: 'MIP, manejo integrado y prevencion' },
  phenology: { label: 'Fenologia', icon: Sprout, color: 'text-emerald-400', description: 'Etapas de desarrollo del cultivo' },
  harvest: { label: 'Cosecha', icon: Leaf, color: 'text-orange-400', description: 'Manejo de cosecha y postcosecha' },
};

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags?: string[];
  crop_types?: string[];
}

interface Protocol {
  id: string;
  problem_type: string;
  problem_name: string;
  crop_type: string;
  severity: string;
  products: any[];
  application_method: string;
  frequency: string;
  waiting_period_days: number;
  prevention_steps?: string[];
  cultural_controls?: string[];
  biological_controls?: string[];
  notes?: string;
}

type ViewMode = 'categories' | 'documents' | 'protocols' | 'detail';

export default function ConocimientoPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ docs: 0, protocols: 0, problems: 0 });

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [docsRes, protosRes] = await Promise.all([
      supabase.from('knowledge_documents').select('*', { count: 'exact', head: true }),
      supabase.from('treatment_protocols').select('*', { count: 'exact', head: true }),
    ]);
    setStats({
      docs: docsRes.count || 0,
      protocols: protosRes.count || 0,
      problems: 24, // known from catalog
    });
  };

  const loadDocuments = async (category?: string) => {
    setLoading(true);
    let query = supabase
      .from('knowledge_documents')
      .select('id, title, content, summary, category, tags, crop_types')
      .order('title');

    if (category) {
      query = query.eq('category', category);
    }

    const { data } = await query;
    setDocuments(data || []);
    setLoading(false);
  };

  const loadProtocols = async (problemType?: string) => {
    setLoading(true);
    let query = supabase
      .from('treatment_protocols')
      .select('*')
      .order('problem_name')
      .order('severity');

    if (problemType) {
      query = query.eq('problem_type', problemType);
    }

    const { data } = await query;
    setProtocols(data || []);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setViewMode('documents');
    setSelectedCategory('search');

    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const orConditions = keywords
      .map(k => `title.ilike.%${k}%,content.ilike.%${k}%,summary.ilike.%${k}%`)
      .join(',');

    const [docsRes, protosRes] = await Promise.all([
      supabase.from('knowledge_documents')
        .select('id, title, content, summary, category, tags, crop_types')
        .or(orConditions)
        .limit(20),
      supabase.from('treatment_protocols')
        .select('*')
        .ilike('problem_name', `%${searchQuery}%`)
        .order('severity'),
    ]);

    setDocuments(docsRes.data || []);
    setProtocols(protosRes.data || []);
    setLoading(false);
  };

  const openCategory = (cat: string) => {
    setSelectedCategory(cat);
    setViewMode('documents');
    loadDocuments(cat);

    // Also load protocols that match
    const typeMap: Record<string, string> = { pest: 'plaga', disease: 'enfermedad', nutrition: 'nutricion', treatment: 'plaga' };
    const problemType = typeMap[cat];
    if (problemType) {
      loadProtocols(problemType);
    } else {
      setProtocols([]);
    }
  };

  const openDocument = (doc: KnowledgeDoc) => {
    setSelectedDoc(doc);
    setViewMode('detail');
  };

  const goBack = () => {
    if (viewMode === 'detail') {
      setSelectedDoc(null);
      setSelectedProtocol(null);
      setViewMode('documents');
    } else {
      setViewMode('categories');
      setSelectedCategory('');
      setDocuments([]);
      setProtocols([]);
      setSearchQuery('');
    }
  };

  // Group protocols by problem_name for the list view
  const groupedProtocols = protocols.reduce<Record<string, Protocol[]>>((acc, p) => {
    if (!acc[p.problem_name]) acc[p.problem_name] = [];
    acc[p.problem_name].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Conocimiento Agronomico</h1>
                <p className="text-xs text-gray-400">
                  {stats.docs} documentos • {stats.protocols} protocolos • {stats.problems} problemas
                </p>
              </div>
            </div>
          </div>
          {viewMode !== 'categories' && (
            <button onClick={goBack} className="text-sm text-gray-400 hover:text-white transition-colors">
              Volver
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 relative z-10">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar plaga, enfermedad, tratamiento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          </div>
        )}

        {/* Categories View */}
        {viewMode === 'categories' && !loading && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Categorias</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={key}
                    onClick={() => openCategory(key)}
                    className="group flex items-start gap-4 p-5 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:border-green-500/30 hover:bg-gray-800/50 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-700/30 flex items-center justify-center shrink-0 group-hover:bg-gray-700/50 transition-colors">
                      <Icon className={`w-5 h-5 ${cat.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white group-hover:text-green-400 transition-colors">{cat.label}</h3>
                      <p className="text-xs text-gray-400 mt-1">{cat.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-green-400 transition-colors mt-0.5" />
                  </button>
                );
              })}
            </div>

            {/* Quick access to all protocols */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-4">Protocolos de Tratamiento</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => { loadProtocols('plaga'); setViewMode('protocols'); setSelectedCategory('plagas'); }}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all"
                >
                  <Bug className="w-5 h-5 text-red-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">Plagas</p>
                    <p className="text-xs text-gray-400">26 protocolos, 12 plagas</p>
                  </div>
                </button>
                <button
                  onClick={() => { loadProtocols('enfermedad'); setViewMode('protocols'); setSelectedCategory('enfermedades'); }}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                >
                  <Droplets className="w-5 h-5 text-purple-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">Enfermedades</p>
                    <p className="text-xs text-gray-400">19 protocolos, 11 enfermedades</p>
                  </div>
                </button>
                <button
                  onClick={() => { loadProtocols('nutricion'); setViewMode('protocols'); setSelectedCategory('nutricion'); }}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
                >
                  <Beaker className="w-5 h-5 text-yellow-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">Nutricion</p>
                    <p className="text-xs text-gray-400">1 protocolo</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Links to other sections */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/diagnostico"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
              >
                <Pill className="w-4 h-4" />
                Diagnostico Rapido
              </Link>
              <Link
                href="/asistente"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/30 text-gray-300 hover:border-green-500/30 hover:text-white transition-colors text-sm"
              >
                <Beaker className="w-4 h-4" />
                Asistente IA
              </Link>
            </div>
          </div>
        )}

        {/* Documents List View */}
        {viewMode === 'documents' && !loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {selectedCategory === 'search'
                  ? `Resultados: "${searchQuery}"`
                  : CATEGORIES[selectedCategory]?.label || selectedCategory}
              </h2>
              <span className="text-sm text-gray-500">({documents.length} docs)</span>
            </div>

            {/* Documents */}
            {documents.length > 0 && (
              <div className="space-y-3">
                {documents.map(doc => {
                  const cat = CATEGORIES[doc.category];
                  const Icon = cat?.icon || FileText;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => openDocument(doc)}
                      className="w-full text-left p-4 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:border-green-500/30 hover:bg-gray-800/50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 ${cat?.color || 'text-gray-400'} mt-0.5 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white">{doc.title}</h3>
                          {doc.summary && (
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{doc.summary}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-700/50 ${cat?.color || 'text-gray-400'}`}>
                              {cat?.label || doc.category}
                            </span>
                            {doc.crop_types?.map(ct => (
                              <span key={ct} className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                                {ct}
                              </span>
                            ))}
                            {doc.tags?.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-800/50 text-gray-500">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 mt-1 shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Protocols found in search */}
            {protocols.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  Protocolos relacionados ({protocols.length})
                </h3>
                {protocols.map(proto => (
                  <TreatmentProtocolCard
                    key={proto.id}
                    protocol={proto}
                    showDetails={false}
                    compact={true}
                  />
                ))}
              </div>
            )}

            {documents.length === 0 && protocols.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">No se encontraron resultados</p>
              </div>
            )}
          </div>
        )}

        {/* Protocols List View */}
        {viewMode === 'protocols' && !loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h2 className="text-lg font-semibold text-white capitalize">
                Protocolos: {selectedCategory}
              </h2>
              <span className="text-sm text-gray-500">({protocols.length} protocolos)</span>
            </div>

            {Object.entries(groupedProtocols).map(([problemName, protos]) => (
              <div key={problemName} className="space-y-2">
                <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2 py-1">
                  <Bug className="w-4 h-4 text-gray-500" />
                  {problemName}
                  <span className="text-xs text-gray-500">({protos.length} protocolos)</span>
                </h3>
                {protos.map(proto => (
                  <TreatmentProtocolCard
                    key={proto.id}
                    protocol={proto}
                    showDetails={true}
                    compact={true}
                  />
                ))}
              </div>
            ))}

            {protocols.length === 0 && (
              <div className="text-center py-12">
                <Pill className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">No hay protocolos en esta categoria</p>
              </div>
            )}
          </div>
        )}

        {/* Document Detail View */}
        {viewMode === 'detail' && selectedDoc && !loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h2 className="text-lg font-semibold text-white">{selectedDoc.title}</h2>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {selectedDoc.crop_types?.map(ct => (
                <span key={ct} className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  <Sprout className="w-3 h-3 inline mr-1" />
                  {ct}
                </span>
              ))}
              {CATEGORIES[selectedDoc.category] && (
                <span className={`text-xs px-2 py-1 rounded-full bg-gray-700/50 ${CATEGORIES[selectedDoc.category].color}`}>
                  {CATEGORIES[selectedDoc.category].label}
                </span>
              )}
              {selectedDoc.tags?.map(tag => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-gray-800/50 text-gray-400">
                  {tag}
                </span>
              ))}
            </div>

            {/* Content */}
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6">
              <div className="prose prose-invert prose-sm max-w-none">
                {selectedDoc.content.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2">{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-base font-semibold text-gray-200 mt-3 mb-1">{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <div key={i} className="flex items-start gap-2 py-0.5">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-gray-300 text-sm">{line.replace('- ', '')}</span>
                      </div>
                    );
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="text-white font-semibold mt-2">{line.replace(/\*\*/g, '')}</p>;
                  }
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  return <p key={i} className="text-gray-300 text-sm leading-relaxed">{line}</p>;
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/diagnostico"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
              >
                <Pill className="w-4 h-4" />
                Diagnostico Rapido
              </Link>
              <Link
                href="/asistente"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/30 text-gray-300 hover:border-green-500/30 hover:text-white transition-colors text-sm"
              >
                <Beaker className="w-4 h-4" />
                Preguntar al Asistente
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

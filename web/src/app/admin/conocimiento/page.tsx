// BerryVision AI - Panel de Administración de Conocimiento
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Bug,
  Leaf,
  Pill,
  Thermometer,
  Sun,
  Scissors,
  Package,
  Save,
  Loader2,
  Trash2,
  Edit,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  crop_types: string[];
  created_at: string;
  view_count: number;
  helpful_count: number;
}

const CATEGORIES = [
  { value: 'disease', label: 'Enfermedad', icon: Bug, color: 'text-red-400' },
  { value: 'pest', label: 'Plaga', icon: Bug, color: 'text-orange-400' },
  { value: 'phenology', label: 'Fenologia', icon: Leaf, color: 'text-green-400' },
  { value: 'nutrition', label: 'Nutricion', icon: Thermometer, color: 'text-blue-400' },
  { value: 'treatment', label: 'Tratamiento', icon: Pill, color: 'text-purple-400' },
  { value: 'best_practice', label: 'Buenas Practicas', icon: CheckCircle, color: 'text-emerald-400' },
  { value: 'variety', label: 'Variedades', icon: Sun, color: 'text-yellow-400' },
  { value: 'harvest', label: 'Cosecha', icon: Scissors, color: 'text-pink-400' },
  { value: 'post_harvest', label: 'Post-Cosecha', icon: Package, color: 'text-cyan-400' },
];

const CROP_TYPES = [
  { value: 'blueberry', label: 'Arandano', emoji: '🫐' },
  { value: 'raspberry', label: 'Frambuesa', emoji: '🍇' },
];

export default function ConocimientoPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'disease',
    tags: '',
    crop_types: ['blueberry'],
  });

  // Load documents
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/knowledge');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        id: editingDoc?.id,
      };

      const res = await fetch('/api/admin/knowledge', {
        method: editingDoc ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingDoc ? 'Documento actualizado' : 'Documento creado' });
        setShowForm(false);
        setEditingDoc(null);
        resetForm();
        loadDocuments();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexion' });
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Estas seguro de eliminar este documento?')) return;

    try {
      const res = await fetch(`/api/admin/knowledge?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Documento eliminado' });
        loadDocuments();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al eliminar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexion' });
    }
  };

  const handleEdit = (doc: KnowledgeDocument) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      content: doc.content,
      summary: doc.summary || '',
      category: doc.category,
      tags: doc.tags.join(', '),
      crop_types: doc.crop_types,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      category: 'disease',
      tags: '',
      crop_types: ['blueberry'],
    });
    setEditingDoc(null);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

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
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Base de Conocimiento</h1>
                  <p className="text-sm text-gray-400">
                    {documents.length} documentos
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Conocimiento
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30'
              : 'bg-red-500/20 border border-red-500/30'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>
              {message.text}
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          >
            <option value="">Todas las categorias</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-[#1a1a24] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-6">
                {editingDoc ? 'Editar Documento' : 'Agregar Conocimiento'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Titulo</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Botrytis cinerea - Control y Tratamiento"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Categoria</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.value })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                            formData.category === cat.value
                              ? 'bg-purple-500/20 border-purple-500/50'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                          <span className="text-sm text-white">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Cultivos</label>
                  <div className="flex gap-3">
                    {CROP_TYPES.map(crop => (
                      <button
                        key={crop.value}
                        type="button"
                        onClick={() => {
                          const newTypes = formData.crop_types.includes(crop.value)
                            ? formData.crop_types.filter(t => t !== crop.value)
                            : [...formData.crop_types, crop.value];
                          setFormData({ ...formData, crop_types: newTypes });
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          formData.crop_types.includes(crop.value)
                            ? 'bg-emerald-500/20 border-emerald-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span>{crop.emoji}</span>
                        <span className="text-white">{crop.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Contenido (incluye sintomas, tratamientos, productos, dosis)
                  </label>
                  <textarea
                    required
                    rows={12}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Describe la enfermedad/plaga, sintomas, condiciones favorables, manejo integrado, productos recomendados con dosis..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Resumen (opcional)</label>
                  <textarea
                    rows={2}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Resumen corto del documento"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tags (separados por coma)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="botrytis, fungicida, moho_gris, pudricion"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingDoc(null);
                    }}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {editingDoc ? 'Actualizar' : 'Guardar'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Documents List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No hay documentos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocs.map(doc => {
              const catInfo = getCategoryInfo(doc.category);
              const CatIcon = catInfo.icon;
              return (
                <div
                  key={doc.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-1.5 rounded-lg bg-white/5`}>
                          <CatIcon className={`w-4 h-4 ${catInfo.color}`} />
                        </div>
                        <span className="text-xs text-gray-500 uppercase">{catInfo.label}</span>
                        <div className="flex gap-1">
                          {doc.crop_types.map(ct => (
                            <span key={ct} className="text-sm">
                              {ct === 'blueberry' ? '🫐' : '🍇'}
                            </span>
                          ))}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{doc.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {doc.summary || doc.content.substring(0, 150)}...
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {doc.tags.slice(0, 5).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(doc)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

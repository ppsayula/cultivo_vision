'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Bug,
  AlertTriangle,
  Leaf,
  Beaker,
  MapPin,
  Sprout,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CatalogoItem {
  id: string;
  nombre: string;
  descripcion?: string;
  sintomas?: string;
  cultivo?: string;
  tipo?: string;
  dosis_recomendada?: string;
  activo: boolean;
}

const CATALOGOS = [
  { id: 'catalogo_cultivos', nombre: 'Cultivos', icon: Sprout, color: 'green' },
  { id: 'catalogo_variedades', nombre: 'Variedades', icon: Leaf, color: 'emerald', needsCultivo: true },
  { id: 'catalogo_sectores', nombre: 'Sectores', icon: MapPin, color: 'blue' },
  { id: 'catalogo_plagas', nombre: 'Plagas', icon: Bug, color: 'red' },
  { id: 'catalogo_enfermedades', nombre: 'Enfermedades', icon: AlertTriangle, color: 'orange' },
  { id: 'catalogo_nutricion', nombre: 'Problemas de Nutricion', icon: Leaf, color: 'yellow' },
  { id: 'catalogo_tratamientos', nombre: 'Tratamientos', icon: Beaker, color: 'purple', hasTipo: true }
];

export default function CatalogosPage() {
  const [catalogoActivo, setCatalogoActivo] = useState(CATALOGOS[0]);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [cultivosList, setCultivosList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogoItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    sintomas: '',
    cultivo: '',
    tipo: '',
    dosis_recomendada: '',
    activo: true
  });

  useEffect(() => {
    loadCatalogo();
    loadCultivos();
  }, [catalogoActivo]);

  const loadCultivos = async () => {
    const { data } = await supabase
      .from('catalogo_cultivos')
      .select('nombre')
      .eq('activo', true);
    setCultivosList(data?.map(c => c.nombre) || []);
  };

  const loadCatalogo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(catalogoActivo.id)
        .select('*')
        .order('nombre');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        activo: form.activo
      };

      // Campos adicionales segun el catalogo
      if (catalogoActivo.id === 'catalogo_plagas' ||
          catalogoActivo.id === 'catalogo_enfermedades' ||
          catalogoActivo.id === 'catalogo_nutricion') {
        data.descripcion = form.descripcion || null;
        data.sintomas = form.sintomas || null;
      }

      if (catalogoActivo.needsCultivo) {
        data.cultivo = form.cultivo || null;
      }

      if (catalogoActivo.hasTipo) {
        data.tipo = form.tipo || null;
        data.dosis_recomendada = form.dosis_recomendada || null;
      }

      if (editingItem) {
        const { error } = await supabase
          .from(catalogoActivo.id)
          .update(data)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(catalogoActivo.id)
          .insert(data);
        if (error) throw error;
      }

      resetForm();
      loadCatalogo();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: CatalogoItem) => {
    setEditingItem(item);
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      sintomas: item.sintomas || '',
      cultivo: item.cultivo || '',
      tipo: item.tipo || '',
      dosis_recomendada: item.dosis_recomendada || '',
      activo: item.activo
    });
    setShowForm(true);
  };

  const handleDelete = async (item: CatalogoItem) => {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;

    try {
      const { error } = await supabase
        .from(catalogoActivo.id)
        .delete()
        .eq('id', item.id);
      if (error) throw error;
      loadCatalogo();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar');
    }
  };

  const toggleActivo = async (item: CatalogoItem) => {
    try {
      const { error } = await supabase
        .from(catalogoActivo.id)
        .update({ activo: !item.activo })
        .eq('id', item.id);
      if (error) throw error;
      loadCatalogo();
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const resetForm = () => {
    setForm({
      nombre: '',
      descripcion: '',
      sintomas: '',
      cultivo: '',
      tipo: '',
      dosis_recomendada: '',
      activo: true
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getColorClasses = (color: string) => ({
    bg: `bg-${color}-500/20`,
    text: `text-${color}-400`,
    border: `border-${color}-500/30`,
    hover: `hover:bg-${color}-500/30`
  });

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Beaker className="w-7 h-7 text-purple-500" />
              Catalogos
            </h1>
            <p className="text-gray-500">Administra los catalogos del sistema</p>
          </div>
        </div>
      </div>

      {/* Tabs de Catalogos */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATALOGOS.map(cat => {
          const Icon = cat.icon;
          const isActive = catalogoActivo.id === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCatalogoActivo(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? `bg-${cat.color}-500/20 text-${cat.color}-400 border border-${cat.color}-500/30`
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{cat.nombre}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                isActive ? `bg-${cat.color}-500/30` : 'bg-gray-700'
              }`}>
                {items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Boton Agregar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Agregar {catalogoActivo.nombre.slice(0, -1)}
        </button>
      </div>

      {/* Modal Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Editar' : 'Agregar'} {catalogoActivo.nombre.slice(0, -1)}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                  autoFocus
                />
              </div>

              {/* Campo Cultivo para variedades */}
              {catalogoActivo.needsCultivo && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cultivo *</label>
                  <select
                    value={form.cultivo}
                    onChange={e => setForm({ ...form, cultivo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  >
                    <option value="">Seleccionar cultivo</option>
                    {cultivosList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Campos para tratamientos */}
              {catalogoActivo.hasTipo && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                    <select
                      value={form.tipo}
                      onChange={e => setForm({ ...form, tipo: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="insecticida">Insecticida</option>
                      <option value="fungicida">Fungicida</option>
                      <option value="fertilizante">Fertilizante</option>
                      <option value="herbicida">Herbicida</option>
                      <option value="biologico">Biologico</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Dosis Recomendada</label>
                    <input
                      type="text"
                      value={form.dosis_recomendada}
                      onChange={e => setForm({ ...form, dosis_recomendada: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="Ej: 1.0 L/ha"
                    />
                  </div>
                </>
              )}

              {/* Campos para plagas/enfermedades/nutricion */}
              {(catalogoActivo.id === 'catalogo_plagas' ||
                catalogoActivo.id === 'catalogo_enfermedades' ||
                catalogoActivo.id === 'catalogo_nutricion') && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Descripcion</label>
                    <textarea
                      value={form.descripcion}
                      onChange={e => setForm({ ...form, descripcion: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Sintomas</label>
                    <textarea
                      value={form.sintomas}
                      onChange={e => setForm({ ...form, sintomas: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {/* Activo */}
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => setForm({ ...form, activo: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-700"
                />
                <span className="text-sm">Activo</span>
              </label>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Items */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <catalogoActivo.icon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">Sin elementos en {catalogoActivo.nombre}</h3>
          <p className="text-gray-600">Agrega el primer elemento al catalogo</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map(item => {
            const Icon = catalogoActivo.icon;
            const isExpanded = expandedItems.has(item.id);
            const hasDetails = item.descripcion || item.sintomas || item.tipo || item.dosis_recomendada;

            return (
              <div
                key={item.id}
                className={`bg-gray-800/50 border rounded-xl transition-all ${
                  item.activo ? 'border-gray-700' : 'border-gray-800 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${catalogoActivo.color}-500/20`}>
                      <Icon className={`w-5 h-5 text-${catalogoActivo.color}-400`} />
                    </div>
                    <div>
                      <span className="text-white font-medium">{item.nombre}</span>
                      {item.cultivo && (
                        <span className="text-gray-500 text-sm ml-2">({item.cultivo})</span>
                      )}
                      {item.tipo && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                          {item.tipo}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasDetails && (
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => toggleActivo(item)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.activo
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-700 text-gray-500 hover:bg-gray-600'
                      }`}
                      title={item.activo ? 'Desactivar' : 'Activar'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-400"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Detalles expandidos */}
                {isExpanded && hasDetails && (
                  <div className="px-4 pb-4 border-t border-gray-700/50 pt-3">
                    {item.descripcion && (
                      <p className="text-gray-400 text-sm mb-2">
                        <span className="text-gray-500">Descripcion:</span> {item.descripcion}
                      </p>
                    )}
                    {item.sintomas && (
                      <p className="text-gray-400 text-sm mb-2">
                        <span className="text-gray-500">Sintomas:</span> {item.sintomas}
                      </p>
                    )}
                    {item.dosis_recomendada && (
                      <p className="text-gray-400 text-sm">
                        <span className="text-gray-500">Dosis:</span> {item.dosis_recomendada}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

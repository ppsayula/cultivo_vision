'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Leaf,
  Plus,
  Save,
  ArrowLeft,
  Calendar,
  MapPin,
  Droplets,
  Scissors,
  User,
  Trash2,
  Edit,
  X,
  Check
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Cultivo {
  id: string;
  ciclo: string;
  anio: number;
  cultivo: string;
  variedad: string;
  sector: string;
  fecha_plantacion: string | null;
  tipo_suelo: string | null;
  en_maceta: boolean;
  sustrato: string | null;
  densidad_plantas: number | null;
  fecha_poda: string | null;
  tipo_poda: string | null;
  sistema_riego: string | null;
  fecha_estimada_cosecha: string | null;
  responsable: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
}

interface Catalogo {
  cultivos: string[];
  variedades: { cultivo: string; nombre: string }[];
  sectores: string[];
}

export default function CultivosPage() {
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogo>({ cultivos: [], variedades: [], sectores: [] });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    ciclo: `${currentYear}-1`,
    anio: currentYear,
    cultivo: '',
    variedad: '',
    sector: '',
    fecha_plantacion: '',
    tipo_suelo: '',
    en_maceta: false,
    sustrato: '',
    densidad_plantas: '',
    fecha_poda: '',
    tipo_poda: '',
    sistema_riego: '',
    fecha_estimada_cosecha: '',
    responsable: '',
    notas: ''
  });

  // Cargar datos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar cultivos
      const { data: cultivosData } = await supabase
        .from('cultivos')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      // Cargar catálogos
      const { data: cultivosCat } = await supabase.from('catalogo_cultivos').select('nombre').eq('activo', true);
      const { data: variedadesCat } = await supabase.from('catalogo_variedades').select('cultivo, nombre').eq('activo', true);
      const { data: sectoresCat } = await supabase.from('catalogo_sectores').select('nombre').eq('activo', true);

      setCultivos(cultivosData || []);
      setCatalogos({
        cultivos: cultivosCat?.map(c => c.nombre) || [],
        variedades: variedadesCat || [],
        sectores: sectoresCat?.map(s => s.nombre) || []
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ciclo: form.ciclo,
        anio: form.anio,
        cultivo: form.cultivo,
        variedad: form.variedad,
        sector: form.sector,
        fecha_plantacion: form.fecha_plantacion || null,
        tipo_suelo: form.tipo_suelo || null,
        en_maceta: form.en_maceta,
        sustrato: form.sustrato || null,
        densidad_plantas: form.densidad_plantas ? parseInt(form.densidad_plantas) : null,
        fecha_poda: form.fecha_poda || null,
        tipo_poda: form.tipo_poda || null,
        sistema_riego: form.sistema_riego || null,
        fecha_estimada_cosecha: form.fecha_estimada_cosecha || null,
        responsable: form.responsable || null,
        notas: form.notas || null
      };

      if (editingId) {
        await supabase.from('cultivos').update(data).eq('id', editingId);
      } else {
        await supabase.from('cultivos').insert(data);
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      ciclo: `${currentYear}-1`,
      anio: currentYear,
      cultivo: '',
      variedad: '',
      sector: '',
      fecha_plantacion: '',
      tipo_suelo: '',
      en_maceta: false,
      sustrato: '',
      densidad_plantas: '',
      fecha_poda: '',
      tipo_poda: '',
      sistema_riego: '',
      fecha_estimada_cosecha: '',
      responsable: '',
      notas: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (cultivo: Cultivo) => {
    setForm({
      ciclo: cultivo.ciclo,
      anio: cultivo.anio,
      cultivo: cultivo.cultivo,
      variedad: cultivo.variedad,
      sector: cultivo.sector,
      fecha_plantacion: cultivo.fecha_plantacion || '',
      tipo_suelo: cultivo.tipo_suelo || '',
      en_maceta: cultivo.en_maceta,
      sustrato: cultivo.sustrato || '',
      densidad_plantas: cultivo.densidad_plantas?.toString() || '',
      fecha_poda: cultivo.fecha_poda || '',
      tipo_poda: cultivo.tipo_poda || '',
      sistema_riego: cultivo.sistema_riego || '',
      fecha_estimada_cosecha: cultivo.fecha_estimada_cosecha || '',
      responsable: cultivo.responsable || '',
      notas: cultivo.notas || ''
    });
    setEditingId(cultivo.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desactivar este cultivo?')) return;
    await supabase.from('cultivos').update({ activo: false }).eq('id', id);
    loadData();
  };

  const variedadesFiltradas = catalogos.variedades.filter(v => v.cultivo === form.cultivo);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

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
              <Leaf className="w-7 h-7 text-green-500" />
              Alta de Cultivos
            </h1>
            <p className="text-gray-500">Registro maestro de cultivos por ciclo</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cultivo
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Editar Cultivo' : 'Nuevo Cultivo'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Ciclo y Año */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ciclo *</label>
                  <input
                    type="text"
                    value={form.ciclo}
                    onChange={e => setForm({ ...form, ciclo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="2025-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Año *</label>
                  <input
                    type="number"
                    value={form.anio}
                    onChange={e => setForm({ ...form, anio: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              {/* Cultivo y Variedad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cultivo *</label>
                  <select
                    value={form.cultivo}
                    onChange={e => setForm({ ...form, cultivo: e.target.value, variedad: '' })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {catalogos.cultivos.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Variedad *</label>
                  <select
                    value={form.variedad}
                    onChange={e => setForm({ ...form, variedad: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                    disabled={!form.cultivo}
                  >
                    <option value="">Seleccionar...</option>
                    {variedadesFiltradas.map(v => (
                      <option key={v.nombre} value={v.nombre}>{v.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sector y Fecha Plantación */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sector *</label>
                  <select
                    value={form.sector}
                    onChange={e => setForm({ ...form, sector: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {catalogos.sectores.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha Plantación</label>
                  <input
                    type="date"
                    value={form.fecha_plantacion}
                    onChange={e => setForm({ ...form, fecha_plantacion: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Suelo y Maceta */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipo de Suelo</label>
                  <select
                    value={form.tipo_suelo}
                    onChange={e => setForm({ ...form, tipo_suelo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Franco">Franco</option>
                    <option value="Franco-arenoso">Franco-arenoso</option>
                    <option value="Franco-arcilloso">Franco-arcilloso</option>
                    <option value="Arenoso">Arenoso</option>
                    <option value="Arcilloso">Arcilloso</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.en_maceta}
                      onChange={e => setForm({ ...form, en_maceta: e.target.checked })}
                      className="w-5 h-5 rounded bg-gray-800 border-gray-700"
                    />
                    En maceta
                  </label>
                </div>
              </div>

              {/* Sustrato y Densidad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sustrato</label>
                  <input
                    type="text"
                    value={form.sustrato}
                    onChange={e => setForm({ ...form, sustrato: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="Peat moss + Perlita"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Densidad (plantas/ha)</label>
                  <input
                    type="number"
                    value={form.densidad_plantas}
                    onChange={e => setForm({ ...form, densidad_plantas: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="5000"
                  />
                </div>
              </div>

              {/* Poda */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha Poda</label>
                  <input
                    type="date"
                    value={form.fecha_poda}
                    onChange={e => setForm({ ...form, fecha_poda: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipo de Poda</label>
                  <select
                    value={form.tipo_poda}
                    onChange={e => setForm({ ...form, tipo_poda: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Renovación">Renovación</option>
                    <option value="Formación">Formación</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Sanitaria">Sanitaria</option>
                  </select>
                </div>
              </div>

              {/* Riego y Cosecha */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sistema de Riego</label>
                  <select
                    value={form.sistema_riego}
                    onChange={e => setForm({ ...form, sistema_riego: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Goteo">Goteo</option>
                    <option value="Aspersión">Aspersión</option>
                    <option value="Microaspersión">Microaspersión</option>
                    <option value="Gravedad">Gravedad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha Est. Cosecha</label>
                  <input
                    type="date"
                    value={form.fecha_estimada_cosecha}
                    onChange={e => setForm({ ...form, fecha_estimada_cosecha: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Responsable */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Responsable</label>
                <input
                  type="text"
                  value={form.responsable}
                  onChange={e => setForm({ ...form, responsable: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Nombre del ingeniero responsable"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  rows={3}
                  placeholder="Observaciones adicionales..."
                />
              </div>

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
                      <Save className="w-5 h-5" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Cultivos */}
      {cultivos.length === 0 ? (
        <div className="text-center py-20">
          <Leaf className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">No hay cultivos registrados</h3>
          <p className="text-gray-600 mb-4">Comienza agregando tu primer cultivo</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Agregar Cultivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cultivos.map(cultivo => (
            <div
              key={cultivo.id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-green-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{cultivo.cultivo}</h3>
                  <p className="text-green-400">{cultivo.variedad}</p>
                </div>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  {cultivo.ciclo}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Sector: {cultivo.sector}</span>
                </div>
                {cultivo.fecha_plantacion && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Plantación: {new Date(cultivo.fecha_plantacion).toLocaleDateString()}</span>
                  </div>
                )}
                {cultivo.sistema_riego && (
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    <span>Riego: {cultivo.sistema_riego}</span>
                  </div>
                )}
                {cultivo.responsable && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{cultivo.responsable}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleEdit(cultivo)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cultivo.id)}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

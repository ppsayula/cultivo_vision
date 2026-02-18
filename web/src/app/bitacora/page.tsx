// Cultivo Vision - Bitacora de Campo
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Bug,
  Leaf,
  Droplets,
  AlertTriangle,
  Save,
  X,
  Plus,
  Check,
  Filter,
  ChevronDown,
  Zap,
  MapPin
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Bitacora {
  id: string;
  ciclo: string;
  anio: number;
  semana: number;
  fecha: string;
  cultivo: string;
  variedad: string;
  sector: string;
  tipo_problema: string;
  problema: string;
  severidad: string;
  tratamiento_producto: string | null;
  tratamiento_dosis: string | null;
  tratamiento_aplicado: boolean;
  fecha_aplicacion: string | null;
  imagen_url: string | null;
  comentarios: string | null;
  registrado_por: string | null;
  created_at: string;
}

interface Catalogos {
  cultivos: string[];
  variedades: { cultivo: string; nombre: string }[];
  sectores: string[];
  plagas: string[];
  enfermedades: string[];
  nutricion: string[];
  tratamientos: { nombre: string; tipo: string; dosis_recomendada: string }[];
}

type FormMode = 'none' | 'quick' | 'full';

export default function BitacoraPage() {
  const [registros, setRegistros] = useState<Bitacora[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos>({
    cultivos: [], variedades: [], sectores: [], plagas: [], enfermedades: [], nutricion: [], tratamientos: []
  });
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<FormMode>('none');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentWeek = getWeekNumber(today);

  const [form, setForm] = useState({
    ciclo: `${currentYear}-1`,
    anio: currentYear,
    semana: currentWeek,
    fecha: today.toISOString().split('T')[0],
    cultivo: '',
    variedad: '',
    sector: '',
    tipo_problema: '',
    problema: '',
    severidad: 'media',
    tratamiento_producto: '',
    tratamiento_dosis: '',
    tratamiento_aplicado: false,
    fecha_aplicacion: '',
    imagen_url: '',
    comentarios: '',
    registrado_por: ''
  });

  const [filtro, setFiltro] = useState({
    semana: 0, // 0 = all weeks
    tipo_problema: '',
    severidad: '',
    sector: '',
    tratado: '' // '' = all, 'si' = treated, 'no' = untreated
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [registrosRes, cultivosRes, variedadesRes, sectoresRes, plagasRes, enfermedadesRes, nutricionRes, tratamientosRes] = await Promise.all([
        supabase.from('v_bitacora_campo').select('*').order('fecha', { ascending: false }).limit(300),
        supabase.from('catalogo_cultivos').select('nombre').eq('activo', true),
        supabase.from('catalogo_variedades').select('cultivo, nombre').eq('activo', true),
        supabase.from('catalogo_sectores').select('nombre').eq('activo', true),
        supabase.from('catalogo_plagas').select('nombre').eq('activo', true),
        supabase.from('catalogo_enfermedades').select('nombre').eq('activo', true),
        supabase.from('catalogo_nutricion').select('nombre').eq('activo', true),
        supabase.from('catalogo_tratamientos').select('nombre, tipo, dosis_recomendada').eq('activo', true)
      ]);

      setRegistros(registrosRes.data || []);
      setCatalogos({
        cultivos: cultivosRes.data?.map(c => c.nombre) || [],
        variedades: variedadesRes.data || [],
        sectores: sectoresRes.data?.map(s => s.nombre) || [],
        plagas: plagasRes.data?.map(p => p.nombre) || [],
        enfermedades: enfermedadesRes.data?.map(e => e.nombre) || [],
        nutricion: nutricionRes.data?.map(n => n.nombre) || [],
        tratamientos: tratamientosRes.data || []
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fileName = `bitacora/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('bitacora-imagenes').upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('bitacora-imagenes').getPublicUrl(fileName);
      setForm({ ...form, imagen_url: urlData.publicUrl });
    } catch (error) {
      console.error('Error uploading:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Quick mode: sector + problema + severidad required
    // Full mode: cultivo + variedad + sector + tipo_problema + problema required
    if (formMode === 'quick') {
      if (!form.sector || !form.problema) {
        alert('Selecciona sector y problema');
        return;
      }
    } else {
      if (!form.cultivo || !form.variedad || !form.sector || !form.tipo_problema || !form.problema) {
        alert('Completa todos los campos obligatorios');
        return;
      }
    }

    setSaving(true);
    try {
      // For quick mode, auto-fill cultivo/variedad based on sector
      let cultivo = form.cultivo;
      let variedad = form.variedad;
      let tipo_problema = form.tipo_problema;

      if (formMode === 'quick') {
        // Infer crop from sector number
        const sectorNum = parseInt(form.sector);
        if (sectorNum >= 100) {
          cultivo = cultivo || 'Frambuesa';
          variedad = variedad || 'Adelita';
        } else {
          cultivo = cultivo || 'Arándano';
          variedad = variedad || 'Biloxi';
        }
        tipo_problema = tipo_problema || 'plaga';
      }

      const data = {
        ciclo: form.ciclo,
        anio: form.anio,
        semana: form.semana,
        fecha: form.fecha,
        cultivo,
        variedad,
        sector: form.sector,
        tipo_problema,
        problema: form.problema,
        severidad: form.severidad,
        tratamiento_producto: form.tratamiento_producto || null,
        tratamiento_dosis: form.tratamiento_dosis || null,
        tratamiento_aplicado: form.tratamiento_aplicado,
        fecha_aplicacion: form.fecha_aplicacion || null,
        imagen_url: form.imagen_url || null,
        comentarios: form.comentarios || null,
        registrado_por: form.registrado_por || null
      };

      const { error } = await supabase.from('bitacora').insert(data);
      if (error) throw error;

      await supabase.from('actividad_diaria').upsert({ fecha: form.fecha, registros_count: 1 }, { onConflict: 'fecha' });

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
      semana: currentWeek,
      fecha: today.toISOString().split('T')[0],
      cultivo: '', variedad: '', sector: '', tipo_problema: '', problema: '',
      severidad: 'media', tratamiento_producto: '', tratamiento_dosis: '',
      tratamiento_aplicado: false, fecha_aplicacion: '', imagen_url: '',
      comentarios: '', registrado_por: ''
    });
    setImagePreview(null);
    setFormMode('none');
  };

  const getProblemasOptions = () => {
    switch (form.tipo_problema) {
      case 'plaga': return catalogos.plagas;
      case 'enfermedad': return catalogos.enfermedades;
      case 'nutricion': return catalogos.nutricion;
      case 'riego': return ['Exceso de riego', 'Deficit de riego', 'Salinidad', 'Obstruccion de goteros'];
      case 'otro': return ['Dano mecanico', 'Dano por clima', 'Maleza', 'Otro'];
      default: return [...catalogos.plagas, ...catalogos.enfermedades];
    }
  };

  const variedadesFiltradas = catalogos.variedades.filter(v => v.cultivo === form.cultivo);

  const getSeveridadColor = (sev: string) => {
    switch (sev) {
      case 'baja': return 'bg-green-500/20 text-green-400';
      case 'media': return 'bg-yellow-500/20 text-yellow-400';
      case 'alta': return 'bg-orange-500/20 text-orange-400';
      case 'critica': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'plaga': return <Bug className="w-4 h-4 text-red-400" />;
      case 'enfermedad': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'nutricion': return <Leaf className="w-4 h-4 text-yellow-400" />;
      case 'riego': return <Droplets className="w-4 h-4 text-blue-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Apply filters
  const registrosFiltrados = registros.filter(r => {
    if (filtro.semana > 0 && r.semana !== filtro.semana) return false;
    if (filtro.tipo_problema && r.tipo_problema !== filtro.tipo_problema) return false;
    if (filtro.severidad && r.severidad !== filtro.severidad) return false;
    if (filtro.sector && r.sector !== filtro.sector) return false;
    if (filtro.tratado === 'si' && !r.tratamiento_aplicado) return false;
    if (filtro.tratado === 'no' && r.tratamiento_aplicado) return false;
    return true;
  });

  // Group by week
  const groupedByWeek: Record<number, Bitacora[]> = {};
  registrosFiltrados.forEach(r => {
    if (!groupedByWeek[r.semana]) groupedByWeek[r.semana] = [];
    groupedByWeek[r.semana].push(r);
  });
  const sortedWeeks = Object.keys(groupedByWeek).map(Number).sort((a, b) => b - a);

  const activeFilterCount = [
    filtro.semana > 0,
    filtro.tipo_problema,
    filtro.severidad,
    filtro.sector,
    filtro.tratado
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* Action bar */}
      <div className="flex items-center gap-3 mb-6">
        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeFilterCount > 0 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800/50 text-gray-400 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="bg-cyan-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <span className="text-gray-600 text-sm">
          {registrosFiltrados.length} registros
        </span>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setFormMode('quick')}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm transition-colors"
          >
            <Zap className="w-4 h-4" />
            Rapido
          </button>
          <button
            onClick={() => setFormMode('full')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Semana</label>
              <select
                value={filtro.semana}
                onChange={e => setFiltro({ ...filtro, semana: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value={0}>Todas</option>
                {[...new Set(registros.map(r => r.semana))].sort((a, b) => b - a).map(w => (
                  <option key={w} value={w}>Sem {w} {w === currentWeek ? '(actual)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select
                value={filtro.tipo_problema}
                onChange={e => setFiltro({ ...filtro, tipo_problema: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="">Todos</option>
                <option value="plaga">Plaga</option>
                <option value="enfermedad">Enfermedad</option>
                <option value="nutricion">Nutricion</option>
                <option value="riego">Riego</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Severidad</label>
              <select
                value={filtro.severidad}
                onChange={e => setFiltro({ ...filtro, severidad: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="">Todas</option>
                <option value="critica">Critica</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sector</label>
              <select
                value={filtro.sector}
                onChange={e => setFiltro({ ...filtro, sector: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="">Todos</option>
                {[...new Set(registros.map(r => r.sector))].sort().map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tratamiento</label>
              <select
                value={filtro.tratado}
                onChange={e => setFiltro({ ...filtro, tratado: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="">Todos</option>
                <option value="si">Tratado</option>
                <option value="no">Sin tratar</option>
              </select>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFiltro({ semana: 0, tipo_problema: '', severidad: '', sector: '', tratado: '' })}
              className="text-xs text-gray-500 hover:text-white mt-3 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Quick Entry Form (inline, not modal) */}
      {formMode === 'quick' && (
        <div className="bg-gray-800/30 border-2 border-cyan-500/30 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-medium">Registro Rapido</h3>
            <button onClick={() => setFormMode('none')} className="ml-auto p-1 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sector *</label>
                <select
                  value={form.sector}
                  onChange={e => setForm({ ...form, sector: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  required
                >
                  <option value="">Seleccionar</option>
                  {catalogos.sectores.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Problema *</label>
                <select
                  value={form.problema}
                  onChange={e => setForm({ ...form, problema: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  required
                >
                  <option value="">Seleccionar</option>
                  {[...catalogos.plagas, ...catalogos.enfermedades].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Severidad</label>
                <div className="flex gap-1">
                  {['baja', 'media', 'alta', 'critica'].map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setForm({ ...form, severidad: sev })}
                      className={`flex-1 py-2 rounded text-xs capitalize transition-all ${
                        form.severidad === sev
                          ? getSeveridadColor(sev) + ' font-medium'
                          : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {sev.charAt(0).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Foto</label>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-sm hover:border-gray-600 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {imagePreview ? 'Foto lista' : uploading ? 'Subiendo...' : 'Agregar'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={form.comentarios}
                onChange={e => setForm({ ...form, comentarios: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                placeholder="Nota rapida (opcional)..."
              />
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
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
      )}

      {/* Full Form Modal */}
      {formMode === 'full' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Nuevo Registro de Campo</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image upload */}
              <div className="bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-600 hover:border-green-500 transition-colors">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setForm({ ...form, imagen_url: '' }); }}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 flex flex-col items-center gap-2 text-gray-400 hover:text-green-400 transition-colors"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Camera className="w-12 h-12" />
                        <span className="text-lg font-medium">Toca para subir foto</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Ciclo, Año, Semana, Fecha */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Ciclo</label>
                  <input type="text" value={form.ciclo} onChange={e => setForm({ ...form, ciclo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Ano</label>
                  <input type="number" value={form.anio} onChange={e => setForm({ ...form, anio: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Semana</label>
                  <input type="number" value={form.semana} onChange={e => setForm({ ...form, semana: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" min={1} max={52} required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" required />
                </div>
              </div>

              {/* Cultivo, Variedad, Sector */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cultivo *</label>
                  <select value={form.cultivo} onChange={e => setForm({ ...form, cultivo: e.target.value, variedad: '' })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required>
                    <option value="">Seleccionar</option>
                    {catalogos.cultivos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Variedad *</label>
                  <select value={form.variedad} onChange={e => setForm({ ...form, variedad: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required disabled={!form.cultivo}>
                    <option value="">Seleccionar</option>
                    {variedadesFiltradas.map(v => <option key={v.nombre} value={v.nombre}>{v.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sector *</label>
                  <select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required>
                    <option value="">Seleccionar</option>
                    {catalogos.sectores.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Tipo de Problema */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Tipo de problema *</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'plaga', label: 'Plaga', icon: Bug, color: 'text-red-400' },
                    { id: 'enfermedad', label: 'Enfermedad', icon: AlertTriangle, color: 'text-orange-400' },
                    { id: 'nutricion', label: 'Nutricion', icon: Leaf, color: 'text-yellow-400' },
                    { id: 'riego', label: 'Riego', icon: Droplets, color: 'text-blue-400' },
                    { id: 'otro', label: 'Otro', icon: AlertTriangle, color: 'text-gray-400' }
                  ].map(tipo => (
                    <button key={tipo.id} type="button"
                      onClick={() => setForm({ ...form, tipo_problema: tipo.id, problema: '' })}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        form.tipo_problema === tipo.id ? 'border-green-500 bg-green-500/10' : 'border-gray-700 hover:border-gray-600'
                      }`}>
                      <tipo.icon className={`w-6 h-6 ${tipo.color}`} />
                      <span className="text-xs text-gray-300">{tipo.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Problema especifico */}
              {form.tipo_problema && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Problema *</label>
                  <select value={form.problema} onChange={e => setForm({ ...form, problema: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required>
                    <option value="">Seleccionar</option>
                    {getProblemasOptions().map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              {/* Severidad */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Severidad</label>
                <div className="grid grid-cols-4 gap-2">
                  {['baja', 'media', 'alta', 'critica'].map(sev => (
                    <button key={sev} type="button" onClick={() => setForm({ ...form, severidad: sev })}
                      className={`py-2 px-3 rounded-lg border-2 transition-all capitalize ${
                        form.severidad === sev ? getSeveridadColor(sev) + ' border-current' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}>
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tratamiento */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <label className="block text-sm text-gray-300 mb-3 font-medium">Tratamiento</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Producto</label>
                    <select value={form.tratamiento_producto}
                      onChange={e => {
                        const p = catalogos.tratamientos.find(t => t.nombre === e.target.value);
                        setForm({ ...form, tratamiento_producto: e.target.value, tratamiento_dosis: p?.dosis_recomendada || '' });
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                      <option value="">Seleccionar</option>
                      {catalogos.tratamientos.map(t => <option key={t.nombre} value={t.nombre}>{t.nombre} ({t.tipo})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Dosis</label>
                    <input type="text" value={form.tratamiento_dosis} onChange={e => setForm({ ...form, tratamiento_dosis: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="Ej: 1.0 L/ha" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={form.tratamiento_aplicado} onChange={e => setForm({ ...form, tratamiento_aplicado: e.target.checked })} className="w-4 h-4 rounded bg-gray-700" />
                    <span className="text-sm">Ya se aplico</span>
                  </label>
                  {form.tratamiento_aplicado && (
                    <input type="date" value={form.fecha_aplicacion} onChange={e => setForm({ ...form, fecha_aplicacion: e.target.value })}
                      className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
                  )}
                </div>
              </div>

              {/* Comentarios y Registrado por */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Comentarios</label>
                  <textarea value={form.comentarios} onChange={e => setForm({ ...form, comentarios: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" rows={2} placeholder="Observaciones..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Registrado por</label>
                  <input type="text" value={form.registrado_por} onChange={e => setForm({ ...form, registrado_por: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Tu nombre" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium">
                  {saving ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <><Save className="w-5 h-5" /> Guardar</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Records grouped by week */}
      {registrosFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <Camera className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">
            {activeFilterCount > 0 ? 'Sin registros con estos filtros' : 'Sin registros aun'}
          </p>
          <button onClick={() => setFormMode('quick')}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
            Crear primer registro
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedWeeks.map(week => (
            <div key={week}>
              {/* Week header */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-sm font-medium px-2.5 py-1 rounded-lg ${
                  week === currentWeek ? 'bg-green-500/20 text-green-400' : 'bg-gray-800/50 text-gray-500'
                }`}>
                  Sem {week}
                </span>
                <span className="text-gray-600 text-xs">{groupedByWeek[week].length} registros</span>
                <div className="flex-1 border-t border-gray-800/50" />
              </div>

              {/* Records */}
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden">
                <div className="divide-y divide-gray-800/50">
                  {groupedByWeek[week].map(registro => (
                    <div key={registro.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/20 transition-colors">
                      {/* Thumbnail */}
                      {registro.imagen_url ? (
                        <img src={registro.imagen_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-800/50 flex items-center justify-center shrink-0">
                          {getTipoIcon(registro.tipo_problema)}
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium truncate">{registro.problema}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs shrink-0 ${getSeveridadColor(registro.severidad)}`}>
                            {registro.severidad}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-gray-600 text-xs">{registro.cultivo}</span>
                          <span className="text-gray-700">·</span>
                          <span className="text-gray-600 text-xs flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />{registro.sector}
                          </span>
                        </div>
                      </div>

                      {/* Treatment status */}
                      {registro.tratamiento_aplicado ? (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded shrink-0">
                          <Check className="w-3 h-3" /> Tratado
                        </span>
                      ) : registro.tratamiento_producto ? (
                        <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded shrink-0">Pendiente</span>
                      ) : (
                        <span className="text-xs text-red-400/60 bg-red-500/10 px-2 py-1 rounded shrink-0">Sin tratar</span>
                      )}

                      {/* Date */}
                      <span className="text-gray-600 text-xs shrink-0">
                        {new Date(registro.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

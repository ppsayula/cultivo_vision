'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Upload,
  ArrowLeft,
  Calendar,
  MapPin,
  Bug,
  Leaf,
  Droplets,
  AlertTriangle,
  Save,
  X,
  Image as ImageIcon,
  Plus,
  ChevronRight,
  Check,
  Trash2,
  Filter
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

export default function BitacoraPage() {
  const [registros, setRegistros] = useState<Bitacora[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos>({
    cultivos: [], variedades: [], sectores: [], plagas: [], enfermedades: [], nutricion: [], tratamientos: []
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calcular semana actual
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
    semana: currentWeek,
    cultivo: '',
    tipo_problema: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar registros
      const { data: registrosData } = await supabase
        .from('bitacora')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Cargar catálogos
      const [cultivosRes, variedadesRes, sectoresRes, plagasRes, enfermedadesRes, nutricionRes, tratamientosRes] = await Promise.all([
        supabase.from('catalogo_cultivos').select('nombre').eq('activo', true),
        supabase.from('catalogo_variedades').select('cultivo, nombre').eq('activo', true),
        supabase.from('catalogo_sectores').select('nombre').eq('activo', true),
        supabase.from('catalogo_plagas').select('nombre').eq('activo', true),
        supabase.from('catalogo_enfermedades').select('nombre').eq('activo', true),
        supabase.from('catalogo_nutricion').select('nombre').eq('activo', true),
        supabase.from('catalogo_tratamientos').select('nombre, tipo, dosis_recomendada').eq('activo', true)
      ]);

      setRegistros(registrosData || []);
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

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload a Supabase Storage
    setUploading(true);
    try {
      const fileName = `bitacora/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('bitacora-imagenes')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('bitacora-imagenes').getPublicUrl(fileName);
      setForm({ ...form, imagen_url: urlData.publicUrl });
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error al subir imagen. Verifica que el bucket "bitacora-imagenes" exista en Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.cultivo || !form.variedad || !form.sector || !form.tipo_problema || !form.problema) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ciclo: form.ciclo,
        anio: form.anio,
        semana: form.semana,
        fecha: form.fecha,
        cultivo: form.cultivo,
        variedad: form.variedad,
        sector: form.sector,
        tipo_problema: form.tipo_problema,
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

      // Registrar actividad del día
      await supabase.from('actividad_diaria').upsert({
        fecha: form.fecha,
        registros_count: 1
      }, {
        onConflict: 'fecha'
      });

      resetForm();
      loadData();
      alert('✅ Registro guardado correctamente');
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
    setImagePreview(null);
    setShowForm(false);
  };

  const getProblemasOptions = () => {
    switch (form.tipo_problema) {
      case 'plaga': return catalogos.plagas;
      case 'enfermedad': return catalogos.enfermedades;
      case 'nutricion': return catalogos.nutricion;
      case 'riego': return ['Exceso de riego', 'Déficit de riego', 'Salinidad', 'Obstrucción de goteros'];
      case 'otro': return ['Daño mecánico', 'Daño por clima', 'Maleza', 'Otro'];
      default: return [];
    }
  };

  const variedadesFiltradas = catalogos.variedades.filter(v => v.cultivo === form.cultivo);

  const getTipoProblemaIcon = (tipo: string) => {
    switch (tipo) {
      case 'plaga': return <Bug className="w-4 h-4 text-red-400" />;
      case 'enfermedad': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'nutricion': return <Leaf className="w-4 h-4 text-yellow-400" />;
      case 'riego': return <Droplets className="w-4 h-4 text-blue-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeveridadColor = (sev: string) => {
    switch (sev) {
      case 'baja': return 'bg-green-500/20 text-green-400';
      case 'media': return 'bg-yellow-500/20 text-yellow-400';
      case 'alta': return 'bg-orange-500/20 text-orange-400';
      case 'critica': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

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
              <Camera className="w-7 h-7 text-green-500" />
              Bitácora de Campo
            </h1>
            <p className="text-gray-500">Semana {currentWeek} • {today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Registro
        </button>
      </div>

      {/* Formulario Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Nuevo Registro de Campo</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Imagen - Lo primero y más visible */}
              <div className="bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-600 hover:border-green-500 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
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
                        <span className="text-sm">o arrastra una imagen aquí</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Ciclo, Año, Semana, Fecha */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Ciclo</label>
                  <input
                    type="text"
                    value={form.ciclo}
                    onChange={e => setForm({ ...form, ciclo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Año</label>
                  <input
                    type="number"
                    value={form.anio}
                    onChange={e => setForm({ ...form, anio: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Semana</label>
                  <input
                    type="number"
                    value={form.semana}
                    onChange={e => setForm({ ...form, semana: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    min={1}
                    max={52}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm({ ...form, fecha: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    required
                  />
                </div>
              </div>

              {/* Cultivo, Variedad, Sector */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cultivo *</label>
                  <select
                    value={form.cultivo}
                    onChange={e => setForm({ ...form, cultivo: e.target.value, variedad: '' })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {catalogos.cultivos.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Variedad *</label>
                  <select
                    value={form.variedad}
                    onChange={e => setForm({ ...form, variedad: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                    disabled={!form.cultivo}
                  >
                    <option value="">Seleccionar</option>
                    {variedadesFiltradas.map(v => (
                      <option key={v.nombre} value={v.nombre}>{v.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sector *</label>
                  <select
                    value={form.sector}
                    onChange={e => setForm({ ...form, sector: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {catalogos.sectores.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tipo de Problema */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">¿Qué tipo de problema observas? *</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'plaga', label: 'Plaga', icon: Bug, color: 'red' },
                    { id: 'enfermedad', label: 'Enfermedad', icon: AlertTriangle, color: 'orange' },
                    { id: 'nutricion', label: 'Nutrición', icon: Leaf, color: 'yellow' },
                    { id: 'riego', label: 'Riego', icon: Droplets, color: 'blue' },
                    { id: 'otro', label: 'Otro', icon: AlertTriangle, color: 'gray' }
                  ].map(tipo => (
                    <button
                      key={tipo.id}
                      type="button"
                      onClick={() => setForm({ ...form, tipo_problema: tipo.id, problema: '' })}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        form.tipo_problema === tipo.id
                          ? `border-${tipo.color}-500 bg-${tipo.color}-500/20`
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <tipo.icon className={`w-6 h-6 text-${tipo.color}-400`} />
                      <span className="text-xs text-gray-300">{tipo.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Problema específico */}
              {form.tipo_problema && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">¿Cuál es el problema? *</label>
                  <select
                    value={form.problema}
                    onChange={e => setForm({ ...form, problema: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  >
                    <option value="">Seleccionar problema</option>
                    {getProblemasOptions().map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="__nuevo__">+ Agregar nuevo...</option>
                  </select>
                </div>
              )}

              {/* Severidad */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Severidad</label>
                <div className="grid grid-cols-4 gap-2">
                  {['baja', 'media', 'alta', 'critica'].map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setForm({ ...form, severidad: sev })}
                      className={`py-2 px-3 rounded-lg border-2 transition-all capitalize ${
                        form.severidad === sev
                          ? getSeveridadColor(sev) + ' border-current'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tratamiento */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <label className="block text-sm text-gray-300 mb-3 font-medium">
                  💊 Tratamiento aplicado o recomendado
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Producto</label>
                    <select
                      value={form.tratamiento_producto}
                      onChange={e => {
                        const producto = catalogos.tratamientos.find(t => t.nombre === e.target.value);
                        setForm({
                          ...form,
                          tratamiento_producto: e.target.value,
                          tratamiento_dosis: producto?.dosis_recomendada || ''
                        });
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="">Seleccionar</option>
                      {catalogos.tratamientos.map(t => (
                        <option key={t.nombre} value={t.nombre}>{t.nombre} ({t.tipo})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Dosis</label>
                    <input
                      type="text"
                      value={form.tratamiento_dosis}
                      onChange={e => setForm({ ...form, tratamiento_dosis: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="Ej: 1.0 L/ha"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.tratamiento_aplicado}
                      onChange={e => setForm({ ...form, tratamiento_aplicado: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700"
                    />
                    <span className="text-sm">Ya se aplicó</span>
                  </label>
                  {form.tratamiento_aplicado && (
                    <input
                      type="date"
                      value={form.fecha_aplicacion}
                      onChange={e => setForm({ ...form, fecha_aplicacion: e.target.value })}
                      className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    />
                  )}
                </div>
              </div>

              {/* Comentarios y Registrado por */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Comentarios</label>
                  <textarea
                    value={form.comentarios}
                    onChange={e => setForm({ ...form, comentarios: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    rows={2}
                    placeholder="Observaciones adicionales..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Registrado por</label>
                  <input
                    type="text"
                    value={form.registrado_por}
                    onChange={e => setForm({ ...form, registrado_por: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  {saving ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar Registro
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Registros */}
      {registros.length === 0 ? (
        <div className="text-center py-20">
          <Camera className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">Sin registros esta semana</h3>
          <p className="text-gray-600 mb-4">Comienza documentando lo que observas en campo</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-lg"
          >
            📸 Agregar Registro
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {registros.map(registro => (
            <div
              key={registro.id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex gap-4">
                {/* Imagen thumbnail */}
                {registro.imagen_url && (
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={registro.imagen_url}
                      alt="Registro"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTipoProblemaIcon(registro.tipo_problema)}
                      <span className="text-white font-medium">{registro.problema}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getSeveridadColor(registro.severidad)}`}>
                        {registro.severidad}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">Sem {registro.semana}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-2">
                    <span>{registro.cultivo} • {registro.variedad}</span>
                    <span>📍 {registro.sector}</span>
                    <span>📅 {new Date(registro.fecha).toLocaleDateString()}</span>
                  </div>

                  {registro.tratamiento_producto && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">💊 {registro.tratamiento_producto}</span>
                      {registro.tratamiento_dosis && <span className="text-gray-500">({registro.tratamiento_dosis})</span>}
                      {registro.tratamiento_aplicado && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
                          ✓ Aplicado
                        </span>
                      )}
                    </div>
                  )}

                  {registro.comentarios && (
                    <p className="text-gray-500 text-sm mt-1 truncate">{registro.comentarios}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

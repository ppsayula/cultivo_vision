// BerryVision AI - Supabase Client for Web

import { createClient } from '@supabase/supabase-js';

// Verificar variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos de base de datos
export interface Analysis {
  id: string;
  user_id: string;
  farm_id: string | null;
  sector_id: string | null;
  sector: string | null;
  timestamp: string;
  latitude: number;
  longitude: number;
  crop_type: 'blueberry' | 'raspberry' | 'other';
  image_url: string | null;
  health_status: 'healthy' | 'alert' | 'critical' | null;
  disease_name: string | null;
  disease_confidence: number | null;
  pest_name: string | null;
  pest_confidence: number | null;
  phenology_bbch: number | null;
  fruit_count: number;
  maturity_green: number;
  maturity_ripe: number;
  maturity_overripe: number;
  recommendation: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  analysis_id: string;
  farm_id: string | null;
  user_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  read: boolean;
  acknowledged: boolean;
  created_at: string;
}

export interface Farm {
  id: string;
  name: string;
  address: string | null;
  total_area_hectares: number | null;
  owner_id: string;
  created_at: string;
}

export interface DashboardStats {
  totalAnalyses: number;
  healthyCount: number;
  alertCount: number;
  criticalCount: number;
  pendingAlerts: number;
  lastAnalysis: Analysis | null;
}

// Funciones de API

export async function getAnalyses(limit = 50, offset = 0): Promise<Analysis[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function getAnalysisById(id: string): Promise<Analysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getAlerts(unreadOnly = false): Promise<Alert[]> {
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function markAlertAsRead(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({ read: true })
    .eq('id', alertId);

  if (error) throw error;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // Total analyses
  const { count: totalAnalyses } = await supabase
    .from('analyses')
    .select('*', { count: 'exact', head: true });

  // Health counts
  const { data: healthData } = await supabase
    .from('analyses')
    .select('health_status');

  const healthyCount = healthData?.filter(a => a.health_status === 'healthy').length || 0;
  const alertCount = healthData?.filter(a => a.health_status === 'alert').length || 0;
  const criticalCount = healthData?.filter(a => a.health_status === 'critical').length || 0;

  // Pending alerts
  const { count: pendingAlerts } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);

  // Last analysis
  const { data: lastAnalysisData } = await supabase
    .from('analyses')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  return {
    totalAnalyses: totalAnalyses || 0,
    healthyCount,
    alertCount,
    criticalCount,
    pendingAlerts: pendingAlerts || 0,
    lastAnalysis: lastAnalysisData || null,
  };
}

export async function getAnalysesByDateRange(
  startDate: string,
  endDate: string
): Promise<Analysis[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAnalysesForHeatmap(): Promise<
  { lat: number; lng: number; weight: number }[]
> {
  const { data, error } = await supabase
    .from('analyses')
    .select('latitude, longitude, health_status')
    .not('latitude', 'is', null);

  if (error) throw error;

  return (data || []).map((a) => ({
    lat: a.latitude,
    lng: a.longitude,
    weight: a.health_status === 'critical' ? 1 : a.health_status === 'alert' ? 0.5 : 0.1,
  }));
}

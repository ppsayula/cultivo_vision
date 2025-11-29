// BerryVision AI - Supabase Client

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';

// Verificar configuración
const isConfigured =
  SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

// Cliente de Supabase con persistencia local
export const supabase = createClient(
  isConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isConfigured ? SUPABASE_ANON_KEY : 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Verificar si Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

// Funciones de autenticación
export async function signIn(email: string, password: string) {
  if (!isConfigured) {
    throw new Error('Supabase no está configurado. Por favor configure SUPABASE_URL y SUPABASE_ANON_KEY');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, name: string) {
  if (!isConfigured) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Funciones de Storage para imágenes
export async function uploadImage(
  filePath: string,
  fileUri: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  if (!isConfigured) {
    throw new Error('Supabase no está configurado');
  }

  // Leer archivo como blob
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from('analysis-images')
    .upload(filePath, blob, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('analysis-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

// Funciones de base de datos para análisis
export async function saveAnalysisToServer(analysis: any) {
  if (!isConfigured) {
    console.log('Supabase no configurado - guardando solo localmente');
    return null;
  }

  try {
    // Intentar obtener usuario actual (puede ser null si no hay sesión)
    let userId = null;
    try {
      const user = await getCurrentUser();
      userId = user?.id || null;
    } catch {
      // Sin usuario autenticado - continuar sin user_id
      console.log('Sin usuario autenticado - guardando sin user_id');
    }

    const { data, error } = await supabase
      .from('analyses')
      .upsert({
        id: analysis.id,
        timestamp: analysis.timestamp,
        latitude: analysis.location?.latitude || 0,
        longitude: analysis.location?.longitude || 0,
        crop_type: analysis.crop_type,
        sector: analysis.sector || null,
        notes: analysis.notes || null,
        image_url: analysis.remote_image_url || null,
        image_hash: analysis.image_hash || null,
        health_status: analysis.analysis?.health_status || null,
        disease_name: analysis.analysis?.disease?.name || null,
        disease_confidence: analysis.analysis?.disease?.confidence || null,
        pest_name: analysis.analysis?.pest?.name || null,
        pest_confidence: analysis.analysis?.pest?.confidence || null,
        phenology_bbch: analysis.analysis?.phenology_bbch || null,
        fruit_count: analysis.analysis?.fruit_count || null,
        maturity_green: analysis.analysis?.maturity?.green || null,
        maturity_ripe: analysis.analysis?.maturity?.ripe || null,
        maturity_overripe: analysis.analysis?.maturity?.overripe || null,
        recommendation: analysis.analysis?.recommendation || null,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error guardando en Supabase:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error en saveAnalysisToServer:', error);
    throw error;
  }
}

export async function getAnalysesFromServer(
  limit: number = 50,
  offset: number = 0
) {
  if (!isConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function getAnalysesBySector(sectorId: string) {
  if (!isConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('sector', sectorId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data;
}

// Obtener análisis dentro de un área geográfica
export async function getAnalysesInBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
) {
  if (!isConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .gte('latitude', minLat)
    .lte('latitude', maxLat)
    .gte('longitude', minLng)
    .lte('longitude', maxLng)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data;
}

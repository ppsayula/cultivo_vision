// Multi-Tenant System for Cultivo Vision
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  domains: string[];
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  app_name: string;
  app_subtitle: string;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
}

// Tenant por defecto (demo/generico)
export const DEFAULT_TENANT: Tenant = {
  id: 'demo',
  slug: 'demo',
  name: 'Demo',
  domain: null,
  domains: [],
  logo_url: null,
  favicon_url: null,
  primary_color: '#22C55E',
  secondary_color: '#3B82F6',
  app_name: 'Cultivo Vision',
  app_subtitle: 'Bitacora de Campo',
  contact_email: null,
  contact_phone: null,
  is_active: true,
};

// Cache de tenants
const tenantCache = new Map<string, { tenant: Tenant; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene el tenant basado en el hostname
 */
export async function getTenantByDomain(hostname: string): Promise<Tenant> {
  // Limpiar hostname
  const cleanHost = hostname.replace(/^www\./, '').toLowerCase();

  // Verificar cache
  const cached = tenantCache.get(cleanHost);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.tenant;
  }

  try {
    // Buscar por dominio principal
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .or(`domain.eq.${cleanHost},domains.cs.{${cleanHost}}`)
      .eq('is_active', true)
      .single();

    if (error || !tenant) {
      console.log(`No tenant found for domain: ${cleanHost}, using default`);
      return DEFAULT_TENANT;
    }

    // Guardar en cache
    tenantCache.set(cleanHost, { tenant, timestamp: Date.now() });
    return tenant;
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return DEFAULT_TENANT;
  }
}

/**
 * Obtiene el tenant por slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !tenant) {
      return null;
    }

    return tenant;
  } catch (error) {
    console.error('Error fetching tenant by slug:', error);
    return null;
  }
}

/**
 * Detecta el hostname desde el request (server-side)
 */
export function getHostFromHeaders(headers: Headers): string {
  const host = headers.get('host') || headers.get('x-forwarded-host') || 'localhost';
  return host.split(':')[0]; // Remover puerto si existe
}

/**
 * Detecta el hostname (client-side)
 */
export function getHostFromWindow(): string {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname;
}

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Tenant, DEFAULT_TENANT, getHostFromWindow } from '@/lib/tenant';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TenantContextType {
  tenant: Tenant;
  isLoading: boolean;
  tenantId: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: DEFAULT_TENANT,
  isLoading: true,
  tenantId: null,
});

export function useTenant() {
  return useContext(TenantContext);
}

interface TenantProviderProps {
  children: ReactNode;
  initialTenant?: Tenant;
}

export function TenantProvider({ children, initialTenant }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant>(initialTenant || DEFAULT_TENANT);
  const [isLoading, setIsLoading] = useState(!initialTenant);

  useEffect(() => {
    if (initialTenant) {
      setTenant(initialTenant);
      setIsLoading(false);
      return;
    }

    async function loadTenant() {
      const hostname = getHostFromWindow();
      const cleanHost = hostname.replace(/^www\./, '').toLowerCase();

      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .or(`domain.eq.${cleanHost},domains.cs.{${cleanHost}}`)
          .eq('is_active', true)
          .single();

        if (!error && data) {
          setTenant(data);
        }
      } catch (err) {
        console.error('Error loading tenant:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTenant();
  }, [initialTenant]);

  return (
    <TenantContext.Provider value={{
      tenant,
      isLoading,
      tenantId: tenant.id === 'demo' ? null : tenant.id
    }}>
      {children}
    </TenantContext.Provider>
  );
}

// Hook para obtener estilos CSS basados en el tenant
export function useTenantStyles() {
  const { tenant } = useTenant();

  return {
    primaryColor: tenant.primary_color,
    secondaryColor: tenant.secondary_color,
    cssVars: {
      '--color-primary': tenant.primary_color,
      '--color-secondary': tenant.secondary_color,
    } as React.CSSProperties,
  };
}

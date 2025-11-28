// BerryVision AI - Network Hook

import { useState, useEffect, useCallback } from 'react';
import { ConnectionMode } from '../types';
import { getNetworkState, subscribeToNetworkChanges } from '../services/network';

interface UseNetworkResult {
  isConnected: boolean;
  connectionMode: ConnectionMode;
  isSlowConnection: boolean;
  syncMode: 'full' | 'light' | 'offline';
  refresh: () => Promise<void>;
}

export function useNetwork(): UseNetworkResult {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('offline');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  const refresh = useCallback(async () => {
    const state = await getNetworkState();
    setIsConnected(state.isConnected);
    setConnectionMode(state.connectionMode);
    setIsSlowConnection(state.isSlowConnection);
  }, []);

  useEffect(() => {
    // Suscribirse a cambios de red
    const unsubscribe = subscribeToNetworkChanges((state) => {
      setIsConnected(state.isConnected);
      setConnectionMode(state.connectionMode);
      setIsSlowConnection(state.isSlowConnection);
    });

    return unsubscribe;
  }, []);

  // Determinar modo de sincronización
  const getSyncMode = (): 'full' | 'light' | 'offline' => {
    if (!isConnected) return 'offline';
    if (connectionMode === 'wifi' || connectionMode === '4g') return 'full';
    return 'light';
  };

  return {
    isConnected,
    connectionMode,
    isSlowConnection,
    syncMode: getSyncMode(),
    refresh,
  };
}

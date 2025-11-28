// BerryVision AI - Network Service
// Detecta tipo de conexión y determina modo de sincronización

import * as Network from 'expo-network';
import { ConnectionMode } from '../types';
import { APP_CONFIG } from '../constants/config';

// Estado de la red
interface NetworkState {
  isConnected: boolean;
  connectionMode: ConnectionMode;
  isSlowConnection: boolean;
}

// Obtener estado actual de la red
export async function getNetworkState(): Promise<NetworkState> {
  try {
    const networkState = await Network.getNetworkStateAsync();

    if (!networkState.isConnected || !networkState.isInternetReachable) {
      return {
        isConnected: false,
        connectionMode: 'offline',
        isSlowConnection: false,
      };
    }

    // Determinar modo de conexión basado en tipo
    let connectionMode: ConnectionMode = 'wifi';

    switch (networkState.type) {
      case Network.NetworkStateType.WIFI:
        connectionMode = 'wifi';
        break;
      case Network.NetworkStateType.CELLULAR:
        // En móvil, asumimos 4G por defecto
        // Podríamos mejorar esto con APIs nativas para detectar 2G/3G/4G/5G
        connectionMode = '4g';
        break;
      case Network.NetworkStateType.NONE:
      case Network.NetworkStateType.UNKNOWN:
      default:
        connectionMode = 'offline';
    }

    // Determinar si es conexión lenta (menos de 1 Mbps)
    // Nota: Expo no provee velocidad directamente, se podría implementar
    // un test de velocidad real si es necesario
    const isSlowConnection = connectionMode === '2g' || connectionMode === '3g';

    return {
      isConnected: connectionMode !== 'offline',
      connectionMode,
      isSlowConnection,
    };
  } catch (error) {
    console.error('Error checking network state:', error);
    return {
      isConnected: false,
      connectionMode: 'offline',
      isSlowConnection: false,
    };
  }
}

// Determinar modo de sincronización basado en conexión
export async function getSyncMode(): Promise<'full' | 'light' | 'offline'> {
  const { connectionMode } = await getNetworkState();

  switch (connectionMode) {
    case 'wifi':
    case '4g':
      return 'full';
    case '3g':
    case '2g':
      return 'light';
    case 'offline':
    default:
      return 'offline';
  }
}

// Test de velocidad simple (descarga pequeño archivo)
export async function testConnectionSpeed(): Promise<number> {
  try {
    const testUrl = 'https://www.google.com/favicon.ico'; // ~1KB
    const startTime = Date.now();

    const response = await fetch(testUrl, {
      method: 'GET',
      cache: 'no-cache',
    });

    if (!response.ok) {
      return 0;
    }

    await response.blob();
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // segundos

    // Aproximar velocidad (muy básico)
    // 1KB en X segundos = 1/X KB/s = 8/X Kbps
    const speedKbps = 8 / duration;
    const speedMbps = speedKbps / 1000;

    return speedMbps;
  } catch {
    return 0;
  }
}

// Verificar si la conexión es suficiente para subir imágenes
export async function canUploadImages(): Promise<boolean> {
  const { connectionMode, isConnected } = await getNetworkState();

  if (!isConnected) return false;

  // Solo WiFi y 4G tienen suficiente ancho de banda
  return connectionMode === 'wifi' || connectionMode === '4g';
}

// Estimar tiempo de subida para una imagen
export function estimateUploadTime(
  fileSizeKB: number,
  connectionMode: ConnectionMode
): number {
  // Velocidades aproximadas (Mbps)
  const speeds: Record<ConnectionMode, number> = {
    wifi: 10,     // 10 Mbps
    '4g': 5,      // 5 Mbps
    '3g': 0.5,    // 500 Kbps
    '2g': 0.05,   // 50 Kbps
    offline: 0,
  };

  const speedMbps = speeds[connectionMode];
  if (speedMbps === 0) return Infinity;

  const speedKBps = (speedMbps * 1000) / 8; // Convertir a KB/s
  return fileSizeKB / speedKBps; // Segundos
}

// Suscribirse a cambios de red (para React hooks)
export function subscribeToNetworkChanges(
  callback: (state: NetworkState) => void
): () => void {
  let isMounted = true;

  // Polling cada 5 segundos (Expo Network no tiene listeners nativos)
  const intervalId = setInterval(async () => {
    if (isMounted) {
      const state = await getNetworkState();
      callback(state);
    }
  }, 5000);

  // Verificar inmediatamente
  getNetworkState().then((state) => {
    if (isMounted) {
      callback(state);
    }
  });

  // Retornar función de cleanup
  return () => {
    isMounted = false;
    clearInterval(intervalId);
  };
}

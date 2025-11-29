// BerryVision AI - Camera Hook

import { useState, useEffect, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { Location as LocationType } from '../types';

// Timeout para obtener ubicación (en ms)
const LOCATION_TIMEOUT = 15000;
const LOCATION_MAX_AGE = 60000; // 1 minuto

interface UseCameraResult {
  // Permisos
  hasPermission: boolean | null;
  requestPermission: () => Promise<void>;

  // Cámara
  cameraRef: React.RefObject<CameraView>;
  facing: CameraType;
  toggleFacing: () => void;
  isReady: boolean;

  // Captura
  takePhoto: () => Promise<{
    uri: string;
    location: LocationType;
  } | null>;
  isCapturing: boolean;

  // Ubicación
  location: LocationType | null;
  locationError: string | null;
  isGettingLocation: boolean;
}

export function useCamera(): UseCameraResult {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [location, setLocation] = useState<LocationType | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Permisos de cámara
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  // Solicitar permisos al montar
  useEffect(() => {
    (async () => {
      // Media Library
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setMediaPermission(mediaStatus.granted);

      // Location - solicitar ambos permisos
      const fgStatus = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(fgStatus.granted);

      if (fgStatus.granted) {
        // Iniciar actualización continua de ubicación
        startLocationUpdates();
        // También iniciar watch para actualizaciones continuas
        startLocationWatch();
      }
    })();

    return () => {
      // Cleanup
    };
  }, []);

  // Watch de ubicación continuo
  const startLocationWatch = async () => {
    try {
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Cada 5 segundos
          distanceInterval: 5, // O cada 5 metros
        },
        (loc) => {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude || undefined,
            accuracy: loc.coords.accuracy || undefined,
          });
          setLocationError(null);
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
    }
  };

  // Obtener ubicación con timeout y fallback
  const getLocationWithFallback = async (): Promise<LocationType> => {
    setIsGettingLocation(true);

    try {
      // Primero intentar obtener la última ubicación conocida (rápido)
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: LOCATION_MAX_AGE,
      });

      if (lastKnown) {
        const lastLocation: LocationType = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          altitude: lastKnown.coords.altitude || undefined,
          accuracy: lastKnown.coords.accuracy || undefined,
        };
        setLocation(lastLocation);

        // Si la última ubicación es reciente, usarla
        const age = Date.now() - lastKnown.timestamp;
        if (age < 30000) { // Menos de 30 segundos
          setIsGettingLocation(false);
          return lastLocation;
        }
      }

      // Intentar obtener ubicación actual con timeout
      const currentLocation = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), LOCATION_TIMEOUT)
        ),
      ]);

      if (currentLocation && typeof currentLocation === 'object' && 'coords' in currentLocation) {
        const newLocation: LocationType = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          altitude: currentLocation.coords.altitude || undefined,
          accuracy: currentLocation.coords.accuracy || undefined,
        };
        setLocation(newLocation);
        setLocationError(null);
        setIsGettingLocation(false);
        return newLocation;
      }

      throw new Error('No se pudo obtener ubicación');
    } catch (error) {
      console.error('Location error:', error);

      // Si hay ubicación en estado, usarla como fallback
      if (location && location.latitude !== 0) {
        setIsGettingLocation(false);
        return location;
      }

      // Último intento: ubicación con menor precisión
      try {
        const lowAccuracy = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const fallbackLocation: LocationType = {
          latitude: lowAccuracy.coords.latitude,
          longitude: lowAccuracy.coords.longitude,
          altitude: lowAccuracy.coords.altitude || undefined,
          accuracy: lowAccuracy.coords.accuracy || undefined,
        };
        setLocation(fallbackLocation);
        setIsGettingLocation(false);
        return fallbackLocation;
      } catch {
        setLocationError('No se pudo obtener la ubicación GPS');
        setIsGettingLocation(false);
        // Retornar ubicación del estado o default
        return location || { latitude: 0, longitude: 0 };
      }
    }
  };

  // Actualizar ubicación (legacy, mantener para compatibilidad)
  const startLocationUpdates = async () => {
    await getLocationWithFallback();
  };

  // Verificar permisos - null significa que todavía está cargando
  const hasPermission =
    cameraPermission === null ? null :
    cameraPermission?.granted === true ? true : false;

  // Solicitar todos los permisos
  const requestPermission = async () => {
    await requestCameraPermission();
    const mediaStatus = await MediaLibrary.requestPermissionsAsync();
    setMediaPermission(mediaStatus.granted);
    const locationStatus = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(locationStatus.granted);

    if (locationStatus.granted) {
      startLocationUpdates();
    }
  };

  // Cambiar cámara frontal/trasera
  const toggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Tomar foto
  const takePhoto = async (): Promise<{
    uri: string;
    location: LocationType;
  } | null> => {
    if (!cameraRef.current || isCapturing) {
      return null;
    }

    setIsCapturing(true);

    try {
      // Obtener ubicación antes de capturar (con fallback robusto)
      const currentLocation = await getLocationWithFallback();

      // Capturar foto
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        exif: true,
      });

      if (!photo) {
        throw new Error('No se pudo capturar la foto');
      }

      // Usar ubicación del EXIF si está disponible y es válida
      let finalLocation = currentLocation;
      if (photo.exif?.GPSLatitude && photo.exif?.GPSLongitude &&
          photo.exif.GPSLatitude !== 0 && photo.exif.GPSLongitude !== 0) {
        finalLocation = {
          latitude: photo.exif.GPSLatitude,
          longitude: photo.exif.GPSLongitude,
          altitude: photo.exif.GPSAltitude || currentLocation.altitude,
          accuracy: currentLocation.accuracy,
        };
      }

      console.log('Photo captured with location:', finalLocation);

      return {
        uri: photo.uri,
        location: finalLocation,
      };
    } catch (error) {
      console.error('Error capturing photo:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  return {
    hasPermission,
    requestPermission,
    cameraRef,
    facing,
    toggleFacing,
    isReady,
    takePhoto,
    isCapturing,
    location,
    locationError,
    isGettingLocation,
  };
}

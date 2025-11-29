// BerryVision AI - Camera Hook

import { useState, useEffect, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { Location as LocationType } from '../types';

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
}

export function useCamera(): UseCameraResult {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [location, setLocation] = useState<LocationType | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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

      // Location
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(locationStatus.granted);

      if (locationStatus.granted) {
        startLocationUpdates();
      }
    })();

    return () => {
      // Cleanup
    };
  }, []);

  // Actualizar ubicación
  const startLocationUpdates = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude || undefined,
        accuracy: loc.coords.accuracy || undefined,
      });
    } catch (error) {
      setLocationError('No se pudo obtener la ubicación');
      console.error('Location error:', error);
    }
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
      // Actualizar ubicación antes de capturar
      await startLocationUpdates();

      // Capturar foto
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        exif: true,
      });

      if (!photo) {
        throw new Error('No se pudo capturar la foto');
      }

      // Obtener ubicación actual o usar la última conocida
      let currentLocation = location;
      if (!currentLocation) {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          currentLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude || undefined,
            accuracy: loc.coords.accuracy || undefined,
          };
        } catch {
          // Usar ubicación por defecto si no hay GPS
          currentLocation = {
            latitude: 0,
            longitude: 0,
          };
        }
      }

      // Intentar extraer ubicación del EXIF si está disponible
      if (photo.exif?.GPSLatitude && photo.exif?.GPSLongitude) {
        currentLocation = {
          latitude: photo.exif.GPSLatitude,
          longitude: photo.exif.GPSLongitude,
          altitude: photo.exif.GPSAltitude,
        };
      }

      return {
        uri: photo.uri,
        location: currentLocation,
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
  };
}

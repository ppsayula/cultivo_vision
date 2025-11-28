// BerryVision AI - Camera Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { useCamera } from '../hooks/useCamera';
import { useNetwork } from '../hooks/useNetwork';
import { useAnalysisStore } from '../store/analysisStore';
import { CropType } from '../types';

interface CameraScreenProps {
  navigation: any;
}

export function CameraScreen({ navigation }: CameraScreenProps) {
  const {
    hasPermission,
    requestPermission,
    cameraRef,
    facing,
    toggleFacing,
    takePhoto,
    isCapturing,
    location,
  } = useCamera();

  const { isConnected, syncMode } = useNetwork();
  const { createAnalysis, isAnalyzing } = useAnalysisStore();

  const [showOptions, setShowOptions] = useState(false);
  const [cropType, setCropType] = useState<CropType>('blueberry');
  const [sector, setSector] = useState('');
  const [notes, setNotes] = useState('');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  // Pantalla de permisos
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.text}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Permisos Requeridos</Text>
        <Text style={styles.text}>
          BerryVision necesita acceso a la cámara, galería y ubicación para funcionar.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Otorgar Permisos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Capturar foto
  const handleCapture = async () => {
    const result = await takePhoto();
    if (result) {
      setCapturedUri(result.uri);
      setShowOptions(true);
    } else {
      Alert.alert('Error', 'No se pudo capturar la foto');
    }
  };

  // Confirmar y analizar
  const handleConfirm = async () => {
    if (!capturedUri || !location) {
      Alert.alert('Error', 'Datos incompletos');
      return;
    }

    setShowOptions(false);

    try {
      const analysis = await createAnalysis(
        capturedUri,
        location,
        cropType,
        sector || undefined,
        notes || undefined
      );

      // Navegar al resultado
      navigation.navigate('Result', { analysisId: analysis.id });
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el análisis');
    } finally {
      setCapturedUri(null);
      setSector('');
      setNotes('');
    }
  };

  // Cancelar
  const handleCancel = () => {
    setShowOptions(false);
    setCapturedUri(null);
    setSector('');
    setNotes('');
  };

  return (
    <View style={styles.container}>
      {/* Cámara */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Overlay superior */}
        <View style={styles.topOverlay}>
          <View style={styles.connectionBadge}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: isConnected ? '#22C55E' : '#EF4444' },
              ]}
            />
            <Text style={styles.connectionText}>
              {syncMode === 'full'
                ? 'Full'
                : syncMode === 'light'
                ? 'Light'
                : 'Offline'}
            </Text>
          </View>

          {location && (
            <Text style={styles.locationText}>
              📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Controles inferiores */}
        <View style={styles.bottomOverlay}>
          {/* Selector de cultivo */}
          <View style={styles.cropSelector}>
            <TouchableOpacity
              style={[
                styles.cropButton,
                cropType === 'blueberry' && styles.cropButtonActive,
              ]}
              onPress={() => setCropType('blueberry')}
            >
              <Text style={styles.cropButtonText}>🫐 Arándano</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cropButton,
                cropType === 'raspberry' && styles.cropButtonActive,
              ]}
              onPress={() => setCropType('raspberry')}
            >
              <Text style={styles.cropButtonText}>🍇 Frambuesa</Text>
            </TouchableOpacity>
          </View>

          {/* Botón de captura */}
          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleFacing}
              disabled={isCapturing}
            >
              <Text style={styles.flipText}>🔄</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.captureButton,
                (isCapturing || isAnalyzing) && styles.captureButtonDisabled,
              ]}
              onPress={handleCapture}
              disabled={isCapturing || isAnalyzing}
            >
              {isCapturing || isAnalyzing ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.galleryButton}
              onPress={() => navigation.navigate('History')}
            >
              <Text style={styles.galleryText}>📋</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {/* Modal de opciones */}
      <Modal visible={showOptions} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Información Adicional</Text>

            <Text style={styles.label}>Sector (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: A3, Norte, Parcela 5"
              value={sector}
              onChangeText={setSector}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observaciones adicionales..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Analizar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  button: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  topOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  locationText: {
    color: '#fff',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cropSelector: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  cropButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  cropButtonActive: {
    backgroundColor: '#22C55E',
  },
  cropButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  captureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 32,
  },
  captureButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22C55E',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipText: {
    fontSize: 24,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryText: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6B7280',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    marginLeft: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

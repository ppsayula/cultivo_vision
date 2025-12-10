// BerryVision AI - Camera Screen (Offline-First)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Animated,
  Vibration,
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
  const {
    saveOnlyLocal,
    createAnalysis,
    isAnalyzing,
    isSaving,
    lastSaveSuccess,
    clearSaveStatus,
    stats,
  } = useAnalysisStore();

  const [showOptions, setShowOptions] = useState(false);
  const [cropType, setCropType] = useState<CropType>('blueberry');
  const [sector, setSector] = useState('');
  const [notes, setNotes] = useState('');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Animación para el toast de éxito
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Mostrar toast de éxito cuando se guarda
  useEffect(() => {
    if (lastSaveSuccess) {
      setSavedCount(prev => prev + 1);
      setShowSuccessToast(true);
      Vibration.vibrate(100); // Feedback háptico

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccessToast(false);
        clearSaveStatus();
      });
    }
  }, [lastSaveSuccess]);

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

  // NUEVO: Solo guardar sin analizar (modo campo)
  const handleSaveOnly = async () => {
    if (!capturedUri) {
      Alert.alert('Error', 'No se capturó la foto');
      return;
    }

    setShowOptions(false);

    const finalLocation = location || { latitude: 0, longitude: 0 };

    try {
      await saveOnlyLocal(
        capturedUri,
        finalLocation,
        cropType,
        sector || undefined,
        notes || undefined
      );
      // El toast se muestra automáticamente por el useEffect
    } catch (error) {
      Alert.alert('Error', `No se pudo guardar: ${(error as Error).message}`);
    } finally {
      setCapturedUri(null);
      setSector('');
      setNotes('');
    }
  };

  // Guardar Y analizar (requiere conexión)
  const handleSaveAndAnalyze = async () => {
    if (!capturedUri) {
      Alert.alert('Error', 'No se capturó la foto');
      return;
    }

    if (!isConnected) {
      Alert.alert(
        'Sin conexión',
        '¿Deseas guardar la foto para analizar después cuando tengas internet?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Guardar', onPress: handleSaveOnly },
        ]
      );
      return;
    }

    setShowOptions(false);

    const finalLocation = location || { latitude: 0, longitude: 0 };

    try {
      const analysis = await createAnalysis(
        capturedUri,
        finalLocation,
        cropType,
        sector || undefined,
        notes || undefined
      );

      navigation.navigate('Result', { analysisId: analysis.id });
    } catch (error) {
      console.error('Error creando análisis:', error);
      Alert.alert('Error', `No se pudo analizar: ${(error as Error).message}`);
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

  const pendingCount = stats.pending_sync || 0;

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
            <View style={styles.locationBadge}>
              <Text style={styles.locationText}>
                📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* Banner de pendientes */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.pendingBanner}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.pendingText}>
              📷 {pendingCount} foto{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''} de analizar
            </Text>
          </TouchableOpacity>
        )}

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
                (isCapturing || isAnalyzing || isSaving) && styles.captureButtonDisabled,
              ]}
              onPress={handleCapture}
              disabled={isCapturing || isAnalyzing || isSaving}
            >
              {isCapturing || isSaving ? (
                <ActivityIndicator color="#22C55E" size="large" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>

            {/* Contador de fotos guardadas en sesión */}
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{savedCount}</Text>
            </View>
          </View>
        </View>

        {/* Toast de éxito */}
        {showSuccessToast && (
          <Animated.View style={[styles.successToast, { opacity: fadeAnim }]}>
            <Text style={styles.successToastText}>✅ Foto guardada</Text>
          </Animated.View>
        )}
      </CameraView>

      {/* Modal de opciones */}
      <Modal visible={showOptions} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📷 Foto Capturada</Text>

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
              numberOfLines={2}
              placeholderTextColor="#9CA3AF"
            />

            {/* Botones de acción */}
            <View style={styles.modalButtons}>
              {/* Botón principal: GUARDAR (siempre funciona) */}
              <TouchableOpacity
                style={styles.saveOnlyButton}
                onPress={handleSaveOnly}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.saveOnlyButtonText}>💾 GUARDAR</Text>
                    <Text style={styles.saveOnlySubtext}>Sin analizar</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Botón secundario: Analizar (requiere conexión) */}
              <TouchableOpacity
                style={[
                  styles.analyzeButton,
                  !isConnected && styles.analyzeButtonDisabled,
                ]}
                onPress={handleSaveAndAnalyze}
                disabled={isAnalyzing || !isConnected}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.analyzeButtonText}>
                      {isConnected ? '🔬 ANALIZAR' : '📵 Sin conexión'}
                    </Text>
                    <Text style={styles.analyzeSubtext}>
                      {isConnected ? 'Con IA ahora' : 'Guarda para después'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Cancelar */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
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
  locationBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    color: '#fff',
    fontSize: 12,
  },
  pendingBanner: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pendingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
  counterBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  successToast: {
    position: 'absolute',
    top: '45%',
    left: '25%',
    right: '25%',
    backgroundColor: 'rgba(34, 197, 94, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  successToastText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    fontSize: 22,
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
    height: 60,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  saveOnlyButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveOnlyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveOnlySubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#4B5563',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  analyzeSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
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
});

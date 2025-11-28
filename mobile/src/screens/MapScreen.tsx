// BerryVision AI - Map Screen

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useAnalysisStore } from '../store/analysisStore';
import { HEALTH_STATUS_COLORS } from '../constants/config';
import { Analysis } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MapScreenProps {
  navigation: any;
}

export function MapScreen({ navigation }: MapScreenProps) {
  const mapRef = useRef<MapView>(null);
  const { analyses, loadAnalyses, isLoading } = useAnalysisStore();
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [filter, setFilter] = useState<'all' | 'healthy' | 'alert' | 'critical'>('all');

  useEffect(() => {
    loadAnalyses();
  }, []);

  // Filtrar análisis
  const filteredAnalyses = analyses.filter((a) => {
    if (filter === 'all') return true;
    return a.analysis?.health_status === filter;
  });

  // Calcular región inicial basada en los análisis
  const getInitialRegion = (): Region => {
    if (filteredAnalyses.length === 0) {
      return {
        latitude: 28.6353,  // Chihuahua, México (ejemplo)
        longitude: -106.0889,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    const lats = filteredAnalyses.map((a) => a.location.latitude);
    const lngs = filteredAnalyses.map((a) => a.location.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = Math.max(0.01, (maxLat - minLat) * 1.5);
    const lngDelta = Math.max(0.01, (maxLng - minLng) * 1.5);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  // Obtener color del marcador
  const getMarkerColor = (analysis: Analysis): string => {
    if (!analysis.analysis) return '#6B7280';
    return HEALTH_STATUS_COLORS[analysis.analysis.health_status];
  };

  // Centrar en todos los marcadores
  const fitToMarkers = () => {
    if (mapRef.current && filteredAnalyses.length > 0) {
      const coordinates = filteredAnalyses.map((a) => ({
        latitude: a.location.latitude,
        longitude: a.location.longitude,
      }));
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filteredAnalyses.map((analysis) => (
          <Marker
            key={analysis.id}
            coordinate={{
              latitude: analysis.location.latitude,
              longitude: analysis.location.longitude,
            }}
            onPress={() => setSelectedAnalysis(analysis)}
          >
            <View
              style={[
                styles.marker,
                { backgroundColor: getMarkerColor(analysis) },
              ]}
            >
              <Text style={styles.markerEmoji}>
                {analysis.crop_type === 'blueberry' ? '🫐' : '🍇'}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        {['all', 'healthy', 'alert', 'critical'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              filter === f && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(f as any)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === 'all'
                ? 'Todos'
                : f === 'healthy'
                ? '✅ Sanos'
                : f === 'alert'
                ? '⚠️ Alerta'
                : '🚨 Crítico'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contador */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>
          {filteredAnalyses.length} análisis
        </Text>
      </View>

      {/* Botón centrar */}
      <TouchableOpacity style={styles.centerButton} onPress={fitToMarkers}>
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>

      {/* Modal de detalle */}
      <Modal
        visible={selectedAnalysis !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAnalysis(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setSelectedAnalysis(null)}
          />
          <View style={styles.modalContent}>
            {selectedAnalysis && (
              <>
                {/* Imagen */}
                {selectedAnalysis.local_image_uri && (
                  <Image
                    source={{ uri: selectedAnalysis.local_image_uri }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                )}

                {/* Estado */}
                <View
                  style={[
                    styles.modalBadge,
                    { backgroundColor: getMarkerColor(selectedAnalysis) },
                  ]}
                >
                  <Text style={styles.modalBadgeText}>
                    {selectedAnalysis.analysis?.health_status === 'healthy'
                      ? '✅ Saludable'
                      : selectedAnalysis.analysis?.health_status === 'alert'
                      ? '⚠️ Alerta'
                      : selectedAnalysis.analysis?.health_status === 'critical'
                      ? '🚨 Crítico'
                      : '⏳ Pendiente'}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.modalInfo}>
                  <Text style={styles.modalCrop}>
                    {selectedAnalysis.crop_type === 'blueberry'
                      ? '🫐 Arándano'
                      : '🍇 Frambuesa'}
                    {selectedAnalysis.sector && ` · ${selectedAnalysis.sector}`}
                  </Text>
                  <Text style={styles.modalDate}>
                    {format(
                      new Date(selectedAnalysis.timestamp),
                      "d 'de' MMMM, HH:mm",
                      { locale: es }
                    )}
                  </Text>
                  <Text style={styles.modalLocation}>
                    📍 {selectedAnalysis.location.latitude.toFixed(5)},{' '}
                    {selectedAnalysis.location.longitude.toFixed(5)}
                  </Text>

                  {/* Diagnóstico */}
                  {selectedAnalysis.analysis?.disease?.name && (
                    <Text style={styles.modalDisease}>
                      🦠 {selectedAnalysis.analysis.disease.name} (
                      {selectedAnalysis.analysis.disease.confidence}%)
                    </Text>
                  )}
                  {selectedAnalysis.analysis?.pest?.name && (
                    <Text style={styles.modalPest}>
                      🐛 {selectedAnalysis.analysis.pest.name} (
                      {selectedAnalysis.analysis.pest.confidence}%)
                    </Text>
                  )}
                </View>

                {/* Botones */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedAnalysis(null)}
                  >
                    <Text style={styles.modalCloseText}>Cerrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalDetailButton}
                    onPress={() => {
                      setSelectedAnalysis(null);
                      navigation.navigate('Result', {
                        analysisId: selectedAnalysis.id,
                      });
                    }}
                  >
                    <Text style={styles.modalDetailText}>Ver Detalle</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerEmoji: {
    fontSize: 18,
  },
  filterContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#22C55E',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  countBadge: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  centerButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  centerButtonText: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: 200,
  },
  modalBadge: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalInfo: {
    padding: 16,
  },
  modalCrop: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalDate: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  modalLocation: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 12,
  },
  modalDisease: {
    color: '#FCA5A5',
    fontSize: 14,
    marginBottom: 4,
  },
  modalPest: {
    color: '#FCD34D',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
  },
  modalCloseButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalDetailButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    marginLeft: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDetailText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

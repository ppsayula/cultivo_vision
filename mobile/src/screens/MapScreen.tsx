// BerryVision AI - Map Screen (Temporary - No Maps)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAnalysisStore } from '../store/analysisStore';
import { HEALTH_STATUS_COLORS } from '../constants/config';
import { Analysis } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MapScreenProps {
  navigation: any;
}

export function MapScreen({ navigation }: MapScreenProps) {
  const { analyses, loadAnalyses, isLoading } = useAnalysisStore();
  const [filter, setFilter] = useState<'all' | 'healthy' | 'alert' | 'critical'>('all');

  useEffect(() => {
    loadAnalyses();
  }, []);

  // Filtrar análisis
  const filteredAnalyses = analyses.filter((a) => {
    if (filter === 'all') return true;
    return a.analysis?.health_status === filter;
  });

  // Obtener color según estado
  const getStatusColor = (analysis: Analysis): string => {
    if (!analysis.analysis) return '#6B7280';
    return HEALTH_STATUS_COLORS[analysis.analysis.health_status];
  };

  const renderItem = ({ item }: { item: Analysis }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Result', { analysisId: item.id })}
    >
      {/* Imagen */}
      {item.local_image_uri && (
        <Image
          source={{ uri: item.local_image_uri }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.cardContent}>
        {/* Badge de estado */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
          <Text style={styles.statusText}>
            {item.analysis?.health_status === 'healthy'
              ? '✅ Sano'
              : item.analysis?.health_status === 'alert'
              ? '⚠️ Alerta'
              : item.analysis?.health_status === 'critical'
              ? '🚨 Crítico'
              : '⏳ Pendiente'}
          </Text>
        </View>

        {/* Info */}
        <Text style={styles.cardCrop}>
          {item.crop_type === 'blueberry' ? '🫐 Arándano' : '🍇 Frambuesa'}
          {item.sector && ` · ${item.sector}`}
        </Text>

        <Text style={styles.cardDate}>
          {format(new Date(item.timestamp), "d MMM, HH:mm", { locale: es })}
        </Text>

        <Text style={styles.cardLocation}>
          📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
        </Text>

        {/* Diagnóstico */}
        {item.analysis?.disease?.name && (
          <Text style={styles.cardDisease}>
            🦠 {item.analysis.disease.name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Análisis Geolocalizados</Text>
        <Text style={styles.headerSubtitle}>
          {filteredAnalyses.length} registros con ubicación
        </Text>
      </View>

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
                ? '✅'
                : f === 'alert'
                ? '⚠️'
                : '🚨'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de análisis */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Cargando análisis...</Text>
        </View>
      ) : filteredAnalyses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyText}>No hay análisis geolocalizados</Text>
          <Text style={styles.emptySubtext}>
            Los análisis aparecerán aquí con su ubicación GPS
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAnalyses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Nota sobre el mapa */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          💡 El mapa interactivo estará disponible pronto
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#1F2937',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#22C55E',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardCrop: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDate: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  cardLocation: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 8,
  },
  cardDisease: {
    color: '#FCA5A5',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  noteContainer: {
    padding: 16,
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  noteText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
});

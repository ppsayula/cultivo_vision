// BerryVision AI - History Screen

import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { useAnalysisStore } from '../store/analysisStore';
import { useNetwork } from '../hooks/useNetwork';
import { HEALTH_STATUS_COLORS } from '../constants/config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Analysis } from '../types';

interface HistoryScreenProps {
  navigation: any;
}

export function HistoryScreen({ navigation }: HistoryScreenProps) {
  const {
    analyses,
    isLoading,
    isSyncing,
    stats,
    loadAnalyses,
    syncPending,
    deleteAnalysis,
  } = useAnalysisStore();
  const { isConnected, syncMode } = useNetwork();

  useEffect(() => {
    loadAnalyses();
  }, []);

  const handleRefresh = async () => {
    await loadAnalyses();
    if (isConnected) {
      await syncPending();
    }
  };

  const handleExportPhoto = async (analysis: Analysis) => {
    if (!analysis.local_image_uri) {
      Alert.alert('Error', 'No hay imagen para exportar');
      return;
    }

    Alert.alert(
      'Exportar Foto',
      '¿Qué deseas hacer con esta foto?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Compartir',
          onPress: async () => {
            try {
              await Share.share({
                url: analysis.local_image_uri!,
                message: `Análisis de cultivo - ${format(new Date(analysis.timestamp), 'd MMM yyyy', { locale: es })}`,
              });
            } catch (error) {
              console.error('Error sharing:', error);
              Alert.alert('Error', 'No se pudo compartir la foto');
            }
          },
        },
        {
          text: 'Guardar en Galería',
          onPress: async () => {
            try {
              // Request permission
              const { status } = await MediaLibrary.requestPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permiso Denegado', 'Se necesita permiso para guardar en la galería');
                return;
              }

              // Copy to gallery
              const asset = await MediaLibrary.createAssetAsync(analysis.local_image_uri!);
              await MediaLibrary.createAlbumAsync('BerryVision', asset, false);

              Alert.alert('Éxito', 'Foto guardada en la galería en la carpeta BerryVision');
            } catch (error) {
              console.error('Error saving to gallery:', error);
              Alert.alert('Error', 'No se pudo guardar en la galería');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Analysis }) => {
    const result = item.analysis;
    const healthColor = result
      ? HEALTH_STATUS_COLORS[result.health_status]
      : '#6B7280';

    const getStatusIcon = () => {
      if (item.analysis_pending) return '⏳';
      switch (result?.health_status) {
        case 'healthy':
          return '✅';
        case 'alert':
          return '⚠️';
        case 'critical':
          return '🚨';
        default:
          return '❓';
      }
    };

    const getSyncIcon = () => {
      switch (item.sync_status) {
        case 'synced':
          return '☁️';
        case 'partial':
          return '📤';
        case 'syncing':
          return '🔄';
        case 'failed':
          return '❌';
        default:
          return '📱';
      }
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Result', { analysisId: item.id })}
        onLongPress={() => handleExportPhoto(item)}
      >
        {/* Thumbnail */}
        {item.local_image_uri ? (
          <Image
            source={{ uri: item.local_image_uri }}
            style={styles.thumbnail}
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Text style={styles.thumbnailPlaceholderText}>📷</Text>
          </View>
        )}

        {/* Contenido */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
            <Text style={styles.cropType}>
              {item.crop_type === 'blueberry' ? '🫐' : '🍇'}
            </Text>
            {item.sector && (
              <Text style={styles.sector}>{item.sector}</Text>
            )}
            <Text style={styles.syncIcon}>{getSyncIcon()}</Text>
          </View>

          {/* Diagnóstico */}
          <View style={styles.diagnosisRow}>
            {result?.disease?.name && (
              <View
                style={[styles.tag, { backgroundColor: '#FEE2E2' }]}
              >
                <Text style={[styles.tagText, { color: '#991B1B' }]}>
                  🦠 {result.disease.name}
                </Text>
              </View>
            )}
            {result?.pest?.name && (
              <View
                style={[styles.tag, { backgroundColor: '#FEF3C7' }]}
              >
                <Text style={[styles.tagText, { color: '#92400E' }]}>
                  🐛 {result.pest.name}
                </Text>
              </View>
            )}
            {result &&
              !result.disease?.name &&
              !result.pest?.name &&
              result.health_status === 'healthy' && (
                <View
                  style={[styles.tag, { backgroundColor: '#D1FAE5' }]}
                >
                  <Text style={[styles.tagText, { color: '#065F46' }]}>
                    Sin problemas
                  </Text>
                </View>
              )}
          </View>

          {/* Fecha y ubicación */}
          <Text style={styles.timestamp}>
            {format(new Date(item.timestamp), "d MMM, HH:mm", {
              locale: es,
            })}
            {' · '}
            {item.location.latitude.toFixed(3)}, {item.location.longitude.toFixed(3)}
          </Text>
        </View>

        {/* Indicador de estado */}
        <View
          style={[styles.healthIndicator, { backgroundColor: healthColor }]}
        />
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.header}>
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total_analyses}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>
            {stats.healthy_count}
          </Text>
          <Text style={styles.statLabel}>Sanos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {stats.alert_count}
          </Text>
          <Text style={styles.statLabel}>Alerta</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            {stats.critical_count}
          </Text>
          <Text style={styles.statLabel}>Crítico</Text>
        </View>
      </View>

      {/* Sync status */}
      {stats.pending_sync > 0 && (
        <TouchableOpacity
          style={styles.syncBanner}
          onPress={syncPending}
          disabled={!isConnected || isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.syncBannerText}>
              {isConnected
                ? `📤 ${stats.pending_sync} pendientes de sincronizar`
                : `📱 ${stats.pending_sync} guardados localmente`}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Connection mode */}
      <View style={styles.connectionInfo}>
        <View
          style={[
            styles.connectionDot,
            { backgroundColor: isConnected ? '#22C55E' : '#EF4444' },
          ]}
        />
        <Text style={styles.connectionText}>
          Modo: {syncMode === 'full' ? 'Completo' : syncMode === 'light' ? 'Ligero' : 'Offline'}
        </Text>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📷</Text>
      <Text style={styles.emptyTitle}>Sin análisis</Text>
      <Text style={styles.emptyText}>
        Toma tu primera foto para comenzar a analizar tus cultivos
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.emptyButtonText}>Capturar Foto</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={analyses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#22C55E"
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.fabIcon}>📷</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  syncBanner: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  syncBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 80,
    height: 80,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  cropType: {
    fontSize: 14,
    marginRight: 6,
  },
  sector: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    color: '#9CA3AF',
    fontSize: 12,
    marginRight: 6,
  },
  syncIcon: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  diagnosisRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  timestamp: {
    color: '#6B7280',
    fontSize: 11,
  },
  healthIndicator: {
    width: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
  },
});

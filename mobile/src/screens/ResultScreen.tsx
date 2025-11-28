// BerryVision AI - Result Screen

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAnalysisStore } from '../store/analysisStore';
import {
  DISEASE_NAMES,
  PEST_NAMES,
  HEALTH_STATUS_COLORS,
  getBBCHDescription,
} from '../constants/config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ResultScreenProps {
  route: {
    params: {
      analysisId: string;
    };
  };
  navigation: any;
}

export function ResultScreen({ route, navigation }: ResultScreenProps) {
  const { analysisId } = route.params;
  const { analyses, isAnalyzing } = useAnalysisStore();
  const analysis = analyses.find((a) => a.id === analysisId);

  if (!analysis) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Análisis no encontrado</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const result = analysis.analysis;
  const healthColor = result
    ? HEALTH_STATUS_COLORS[result.health_status]
    : '#6B7280';

  const getHealthLabel = () => {
    switch (result?.health_status) {
      case 'healthy':
        return 'Saludable';
      case 'alert':
        return 'Alerta';
      case 'critical':
        return 'Crítico';
      default:
        return 'Pendiente';
    }
  };

  const getSyncStatusLabel = () => {
    switch (analysis.sync_status) {
      case 'synced':
        return '✅ Sincronizado';
      case 'partial':
        return '📤 Datos enviados';
      case 'pending':
        return '⏳ Pendiente';
      case 'syncing':
        return '🔄 Sincronizando...';
      case 'failed':
        return '❌ Error';
      default:
        return 'Desconocido';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Imagen */}
      {analysis.local_image_uri && (
        <Image
          source={{ uri: analysis.local_image_uri }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Estado de salud */}
      <View style={[styles.healthBadge, { backgroundColor: healthColor }]}>
        {analysis.analysis_pending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.healthIcon}>
              {result?.health_status === 'healthy'
                ? '✅'
                : result?.health_status === 'alert'
                ? '⚠️'
                : '🚨'}
            </Text>
            <Text style={styles.healthText}>{getHealthLabel()}</Text>
          </>
        )}
      </View>

      {/* Info básica */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cultivo</Text>
          <Text style={styles.infoValue}>
            {analysis.crop_type === 'blueberry' ? '🫐 Arándano' : '🍇 Frambuesa'}
          </Text>
        </View>

        {analysis.sector && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sector</Text>
            <Text style={styles.infoValue}>{analysis.sector}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha</Text>
          <Text style={styles.infoValue}>
            {format(new Date(analysis.timestamp), "d 'de' MMMM, HH:mm", {
              locale: es,
            })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ubicación</Text>
          <Text style={styles.infoValue}>
            {analysis.location.latitude.toFixed(5)},{' '}
            {analysis.location.longitude.toFixed(5)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado Sync</Text>
          <Text style={styles.infoValue}>{getSyncStatusLabel()}</Text>
        </View>
      </View>

      {/* Resultados del análisis */}
      {result && !analysis.analysis_pending && (
        <>
          {/* Enfermedad */}
          {result.disease?.name && (
            <View style={styles.detectionCard}>
              <View style={styles.detectionHeader}>
                <Text style={styles.detectionIcon}>🦠</Text>
                <Text style={styles.detectionTitle}>Enfermedad Detectada</Text>
              </View>
              <Text style={styles.detectionName}>
                {DISEASE_NAMES[result.disease.name] || result.disease.name}
              </Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${result.disease.confidence}%`,
                      backgroundColor:
                        result.disease.confidence >= 70 ? '#EF4444' : '#F59E0B',
                    },
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>
                Confianza: {result.disease.confidence}%
              </Text>
            </View>
          )}

          {/* Plaga */}
          {result.pest?.name && (
            <View style={styles.detectionCard}>
              <View style={styles.detectionHeader}>
                <Text style={styles.detectionIcon}>🐛</Text>
                <Text style={styles.detectionTitle}>Plaga Detectada</Text>
              </View>
              <Text style={styles.detectionName}>
                {PEST_NAMES[result.pest.name] || result.pest.name}
              </Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${result.pest.confidence}%`,
                      backgroundColor:
                        result.pest.confidence >= 70 ? '#EF4444' : '#F59E0B',
                    },
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>
                Confianza: {result.pest.confidence}%
              </Text>
            </View>
          )}

          {/* Fenología */}
          <View style={styles.phenologyCard}>
            <Text style={styles.phenologyTitle}>Etapa Fenológica</Text>
            <Text style={styles.phenologyValue}>
              {getBBCHDescription(result.phenology_bbch)}
            </Text>
          </View>

          {/* Frutos */}
          {result.fruit_count > 0 && (
            <View style={styles.fruitCard}>
              <Text style={styles.fruitTitle}>
                Frutos Detectados: {result.fruit_count}
              </Text>
              <View style={styles.fruitGrid}>
                <View style={styles.fruitItem}>
                  <Text style={styles.fruitIcon}>🟢</Text>
                  <Text style={styles.fruitCount}>{result.maturity.green}</Text>
                  <Text style={styles.fruitLabel}>Verde</Text>
                </View>
                <View style={styles.fruitItem}>
                  <Text style={styles.fruitIcon}>🔴</Text>
                  <Text style={styles.fruitCount}>{result.maturity.ripe}</Text>
                  <Text style={styles.fruitLabel}>Maduro</Text>
                </View>
                <View style={styles.fruitItem}>
                  <Text style={styles.fruitIcon}>🟤</Text>
                  <Text style={styles.fruitCount}>
                    {result.maturity.overripe}
                  </Text>
                  <Text style={styles.fruitLabel}>Sobre Maduro</Text>
                </View>
              </View>
            </View>
          )}

          {/* Recomendación */}
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>💡 Recomendación</Text>
            <Text style={styles.recommendationText}>
              {result.recommendation}
            </Text>
          </View>
        </>
      )}

      {/* Notas */}
      {analysis.notes && (
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>📝 Notas</Text>
          <Text style={styles.notesText}>{analysis.notes}</Text>
        </View>
      )}

      {/* Botones */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.newButtonText}>📷 Nuevo Análisis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyButtonText}>📋 Ver Historial</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  image: {
    width: '100%',
    height: 250,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 16,
  },
  healthIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  healthText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#1F2937',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  detectionCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  detectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  detectionTitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  detectionName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 8,
  },
  confidenceFill: {
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  phenologyCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  phenologyTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  phenologyValue: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '600',
  },
  fruitCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  fruitTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  fruitGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fruitItem: {
    alignItems: 'center',
  },
  fruitIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  fruitCount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fruitLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  recommendationCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  recommendationTitle: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  notesCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  notesTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  notesText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  newButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyButton: {
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  backButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

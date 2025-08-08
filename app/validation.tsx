import React, { useState } from 'react';
import { StyleSheet, View, Image, Pressable, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, ValidationRequest } from '@/utils/auth';
import { API_BASE_URL } from '@/config/api';
import AuthGuard from '@/components/AuthGuard';

export default function ValidationScreen() {
  const params = useLocalSearchParams();
  const { user, token } = useAuth();
  const [observacion, setObservacion] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  
  // Parse the prediction data from route params
  const radiografiaData = params.radiografiaData ? JSON.parse(params.radiografiaData as string) : null;
  const imageUrl = params.imageUrl as string; // URL de Firebase Storage
  const localImageUri = params.localImageUri as string; // URI local como backup
  
  // Debug logs
  console.log('=== VALIDATION DEBUG ===');
  console.log('Params:', params);
  console.log('Image URL (Firebase):', imageUrl);
  console.log('Local Image URI:', localImageUri);
  console.log('Radiografia data:', radiografiaData);
  
  if (!radiografiaData || (!imageUrl && !localImageUri)) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>
          Error: No se encontraron datos de la radiografía
        </ThemedText>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Volver</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const prediction = radiografiaData.prediccion;
  const isFracture = prediction?.etiqueta?.toLowerCase() === 'fractura';

  const handleValidate = async (isValid: boolean, nuevaEtiqueta?: string) => {
    if (!token || !radiografiaData?.resultado_id) {
      Alert.alert('Error', 'No se encontró información de validación necesaria');
      return;
    }

    const validationText = isValid ? 'válida' : 'inválida';
    Alert.alert(
      'Confirmar Validación',
      `¿Estás seguro de marcar esta predicción como ${validationText}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsValidating(true);
            
            try {
              const validationData: ValidationRequest = {
                validado: isValid,
                observacion: observacion.trim() || undefined,
                nueva_etiqueta: nuevaEtiqueta,
              };

              console.log('Validating with data:', validationData);
              console.log('Resultado ID:', radiografiaData.resultado_id);

              const result = await authApi.validateResultado(
                radiografiaData.resultado_id,
                validationData,
                API_BASE_URL,
                token
              );

              Alert.alert(
                'Validación Completada',
                `${result.message}\nValidado por: ${result.validado_por}`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Go back to home and reset state
                      router.replace('/');
                    },
                  },
                ]
              );

            } catch (error) {
              console.error('Error en validación:', error);
              Alert.alert(
                'Error', 
                error instanceof Error ? error.message : 'No se pudo completar la validación'
              );
            } finally {
              setIsValidating(false);
            }
          },
        },
      ]
    );
  };

  const handleNewScan = () => {
    // Go back to home for new scan
    router.replace('/');
  };

  return (
    <AuthGuard>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ThemedText type="title" style={styles.title}>
            Validación de Predicción
          </ThemedText>

          {/* Image Display */}
          <View style={styles.imageFrame}>
            {(imageUrl || localImageUri) ? (
              <Image
                source={{ uri: imageUrl || localImageUri }}
                style={styles.preview}
                resizeMode="contain"
                onError={(error) => {
                  console.error('Error loading image from Firebase, trying local URI:', error);
                  // If Firebase URL fails, could try local URI as backup
                }}
                onLoad={() => {
                  console.log('Image loaded successfully from:', imageUrl ? 'Firebase' : 'Local');
                }}
              />
            ) : (
              <ThemedText style={styles.errorText}>
                No se pudo cargar la imagen
              </ThemedText>
            )}
          </View>

          {/* Prediction Results */}
          <View style={styles.resultContainer}>
            <ThemedText type="subtitle" style={styles.resultTitle}>
              Resultado del Modelo IA
            </ThemedText>
            
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <ThemedText type="defaultSemiBold" style={styles.resultLabel}>
                  Diagnóstico:
                </ThemedText>
                <ThemedText style={[
                  styles.resultValue, 
                  isFracture ? styles.fractureText : styles.normalText
                ]}>
                  {prediction?.etiqueta || 'No disponible'}
                </ThemedText>
              </View>
              
              <View style={styles.resultRow}>
                <ThemedText type="default" style={styles.resultLabel}>
                  Confianza:
                </ThemedText>
                <ThemedText style={styles.resultValue}>
                  {prediction?.confianza_porcentaje || 0}%
                </ThemedText>
              </View>
              
              <View style={styles.resultRow}>
                <ThemedText type="default" style={styles.resultLabel}>
                  Estado:
                </ThemedText>
                <ThemedText style={styles.resultValue}>
                  {radiografiaData.estado}
                </ThemedText>
              </View>

              <View style={styles.resultRow}>
                <ThemedText type="default" style={styles.resultLabel}>
                  Radiografía ID:
                </ThemedText>
                <ThemedText style={[styles.resultValue, styles.idText]}>
                  {radiografiaData.id}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Validation Section */}
          <View style={styles.validationContainer}>
            <ThemedText type="subtitle" style={styles.validationTitle}>
              Validación Médica
            </ThemedText>
            
            <ThemedText type="default" style={styles.validatorInfo}>
              Validador: {user?.email || 'No identificado'}
            </ThemedText>

            {/* Observation Input */}
            <View style={styles.inputContainer}>
              <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
                Observaciones:
              </ThemedText>
              <TextInput
                style={styles.observationInput}
                placeholder="Agregar observaciones médicas (opcional)"
                placeholderTextColor="#888"
                value={observacion}
                onChangeText={setObservacion}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Validation Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable 
                style={[
                  styles.validationButton, 
                  styles.validButton,
                  isValidating && styles.disabledButton
                ]} 
                onPress={() => handleValidate(true)}
                disabled={isValidating}
              >
                {isValidating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText type="defaultSemiBold" style={styles.validButtonText}>
                    ✓ Validar como Correcto
                  </ThemedText>
                )}
              </Pressable>

              <Pressable 
                style={[
                  styles.validationButton, 
                  styles.invalidButton,
                  isValidating && styles.disabledButton
                ]} 
                onPress={() => handleValidate(false)}
                disabled={isValidating}
              >
                {isValidating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText type="defaultSemiBold" style={styles.invalidButtonText}>
                    ✗ Marcar como Incorrecto
                  </ThemedText>
                )}
              </Pressable>

              {/* Correction Button - Only show "Corregir a Fractura" when it's normal */}
              {!isFracture && (
                <Pressable 
                  style={[
                    styles.validationButton, 
                    styles.correctionButton,
                    isValidating && styles.disabledButton
                  ]} 
                  onPress={() => handleValidate(false, 'fractura')}
                  disabled={isValidating}
                >
                  <ThemedText type="defaultSemiBold" style={styles.correctionButtonText}>
                    🔄 Corregir a Fractura
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <Pressable style={styles.newScanButton} onPress={handleNewScan}>
              <ThemedText type="defaultSemiBold" style={styles.newScanText}>
                Nueva Radiografía
              </ThemedText>
            </Pressable>

            <Pressable 
              style={styles.homeButton} 
              onPress={() => router.replace('/')}
            >
              <ThemedText type="defaultSemiBold" style={styles.homeButtonText}>
                Ir al Inicio
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  imageFrame: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00C2FF',
    backgroundColor: '#f0f8ff',
    marginBottom: 20,
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  resultContainer: {
    marginBottom: 25,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00C2FF',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  resultValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  fractureText: {
    color: '#ff6b6b',
  },
  normalText: {
    color: '#51cf66',
  },
  idText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  validationContainer: {
    marginBottom: 25,
  },
  validationTitle: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  validatorInfo: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  observationInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#fff',
    minHeight: 100,
  },
  buttonContainer: {
    gap: 15,
  },
  validationButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  validButton: {
    backgroundColor: '#51cf66',
  },
  invalidButton: {
    backgroundColor: '#ff6b6b',
  },
  validButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  invalidButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  correctionButton: {
    backgroundColor: '#ffa500',
  },
  correctionButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  newScanButton: {
    flex: 1,
    backgroundColor: '#00C2FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  newScanText: {
    color: '#fff',
    fontSize: 16,
  },
  homeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  backButton: {
    backgroundColor: '#555',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
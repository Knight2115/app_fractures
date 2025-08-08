import React, { useState, useLayoutEffect } from 'react';
import { StyleSheet, View, Image, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, RadiografiaResponse } from '@/utils/auth';
import { API_BASE_URL } from '@/config/api';
import AuthGuard from '@/components/AuthGuard';

export default function ScanScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<RadiografiaResponse | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Predicción de Fracturas',
    });
  }, [navigation]);

  // Función para validar que sea JPG, JPEG o PNG
  const isValidImage = (uri: string) => {
    const uriLower = uri.toLowerCase();
    return uriLower.endsWith('.jpg') || uriLower.endsWith('.jpeg') || uriLower.endsWith('.png');
  };

  // Abrir cámara para tomar foto
  const takePhoto = async () => {
    // Pedir permisos cámara
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a la cámara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      base64: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.uri && isValidImage(asset.uri)) {
        setImage(asset.uri);
        setSelectedAsset(asset);
        setPredictionResult(null);
      } else {
        Alert.alert('Error', 'Por favor toma una foto en formato JPG o PNG.');
      }
    }
  };

  // Abrir galería para seleccionar imagen
  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      base64: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.uri && isValidImage(asset.uri)) {
        setImage(asset.uri);
        setSelectedAsset(asset);
        setPredictionResult(null);
      } else {
        Alert.alert('Error', 'Por favor selecciona solo imágenes JPG o PNG.');
      }
    }
  };

  // Mostrar opciones para tomar foto o seleccionar imagen
  const pickImage = () => {
    Alert.alert(
      'Seleccionar imagen',
      '¿Quieres tomar una foto o seleccionar de la galería?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar Foto', onPress: takePhoto },
        { text: 'Seleccionar de la Galería', onPress: pickImageFromGallery },
      ]
    );
  };

  const handlePrediction = async () => {
    if (!image || !selectedAsset || !token) {
      Alert.alert('Error', 'No hay imagen seleccionada o no estás autenticado');
      return;
    }

    setIsUploading(true);

    try {
      console.log('Subiendo radiografía...');
      const filename = selectedAsset.fileName || `radiografia_${Date.now()}.jpg`;
      
      const result = await authApi.uploadRadiografia(
        image,
        filename,
        API_BASE_URL,
        token
      );

      console.log('Resultado de la predicción:', result);
      setPredictionResult(result);

      // Navigate to validation screen with the results (replace to avoid stack buildup)
      router.replace({
        pathname: '/validation',
        params: {
          radiografiaData: JSON.stringify(result.data),
          imageUrl: result.data.url, // URL de Firebase Storage
          localImageUri: image, // URI local como backup
        },
      });

    } catch (error) {
      console.error('Error en predicción:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo procesar la radiografía');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AuthGuard>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Pressable 
            style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]} 
            onPress={pickImage}
            disabled={isUploading}
          >
            <ThemedText type="defaultSemiBold" style={styles.uploadText}>
              Seleccionar Imagen
            </ThemedText>
          </Pressable>

          <View style={styles.imageFrame}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={styles.preview}
                resizeMode="contain"
              />
            ) : (
              <ThemedText type="defaultSemiBold" style={styles.placeholderText}>
                Aquí se mostrará la imagen JPG/PNG seleccionada
              </ThemedText>
            )}
          </View>

          {image && (
            <Pressable 
              style={[styles.predictButton, isUploading && styles.predictButtonDisabled]} 
              onPress={handlePrediction}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText type="defaultSemiBold" style={styles.predictText}>
                  Realizar Predicción
                </ThemedText>
              )}
            </Pressable>
          )}

          {predictionResult && predictionResult.data.prediccion && (
            <View style={styles.resultContainer}>
              <ThemedText type="subtitle" style={styles.resultTitle}>
                Resultado de la Predicción
              </ThemedText>
              
              <View style={styles.resultCard}>
                <ThemedText type="defaultSemiBold" style={styles.resultLabel}>
                  Diagnóstico: 
                  <ThemedText style={[styles.resultValue, 
                    predictionResult.data.prediccion.etiqueta.toLowerCase() === 'fractura' 
                      ? styles.fractureText : styles.normalText]}>
                    {predictionResult.data.prediccion.etiqueta}
                  </ThemedText>
                </ThemedText>
                
                <ThemedText type="default" style={styles.resultLabel}>
                  Confianza: 
                  <ThemedText style={styles.resultValue}>
                    {predictionResult.data.prediccion.confianza_porcentaje}%
                  </ThemedText>
                </ThemedText>
                
                <ThemedText type="default" style={styles.resultLabel}>
                  Estado: 
                  <ThemedText style={styles.resultValue}>
                    {predictionResult.data.estado}
                  </ThemedText>
                </ThemedText>
              </View>
            </View>
          )}
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
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#00C2FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: '#666',
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
  },
  imageFrame: {
    width: '90%',
    height: 300,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00C2FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  predictButton: {
    marginTop: 20,
    backgroundColor: '#0077cc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  predictButtonDisabled: {
    backgroundColor: '#666',
  },
  predictText: {
    color: '#fff',
    fontSize: 16,
  },
  resultContainer: {
    width: '100%',
    marginTop: 30,
    padding: 20,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 15,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00C2FF',
  },
  resultLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  resultValue: {
    fontWeight: 'bold',
  },
  fractureText: {
    color: '#ff6b6b',
  },
  normalText: {
    color: '#51cf66',
  },
});

import React, { useState } from 'react';
import { StyleSheet, View, Image, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/utils/auth';
import { API_BASE_URL } from '@/config/api';
import AuthGuard from '@/components/AuthGuard';

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { logout, user, token } = useAuth();

  // Reset image state when screen gains focus (coming back from validation)
  useFocusEffect(
    React.useCallback(() => {
      // Clear previous image when returning from validation
      setImage(null);
      setSelectedAsset(null);
      setIsUploading(false);
    }, [])
  );

  const isValidImage = (uri: string) => {
    const uriLower = uri.toLowerCase();
    return uriLower.endsWith('.jpg') || uriLower.endsWith('.jpeg') || uriLower.endsWith('.png');
  };

  const takePhoto = async () => {
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
      } else {
        Alert.alert('Error', 'Por favor toma una foto en formato JPG o PNG.');
      }
    }
  };

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
      } else {
        Alert.alert('Error', 'Por favor selecciona solo imágenes JPG o PNG.');
      }
    }
  };

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
      Alert.alert('Error', 'Por favor selecciona una imagen primero o verifica tu autenticación');
      return;
    }

    setIsUploading(true);

    try {
      console.log('Subiendo radiografía desde index...');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Token disponible:', !!token);
      console.log('Image URI:', image);
      
      const filename = selectedAsset.fileName || `radiografia_${Date.now()}.jpg`;
      console.log('Filename:', filename);
      
      const result = await authApi.uploadRadiografia(
        image,
        filename,
        API_BASE_URL,
        token
      );

      console.log('Resultado de la predicción:', result);

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

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        },
      ]
    );
  };

  return (
    <AuthGuard>
      <ThemedView style={styles.container}>
        {/* Background Image */}
        <ExpoImage
          source={require('@/assets/images/app_fracture_logo.png')}
          contentFit="cover"
          style={styles.backgroundImage}
        />

        {/* Dark overlay for contrast */}
        <View style={styles.overlay} />

        {/* Content */}
        <View style={styles.content}>
          {/* Header with user info and logout button */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <ThemedText style={styles.avatarText}>
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </ThemedText>
              </View>
              <View style={styles.userDetails}>
                <ThemedText type="defaultSemiBold" style={styles.welcomeText}>
                  ¡Bienvenido!
                </ThemedText>
                <ThemedText style={styles.userEmail}>
                  {user?.email || 'Usuario'}
                </ThemedText>
                {user?.rol && (
                  <ThemedText style={styles.userRole}>
                    {user.rol === 'medico' ? '👩‍⚕️ Médico' : '🔬 Técnico'}
                  </ThemedText>
                )}
              </View>
            </View>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <View style={styles.logoutButtonContent}>
                <ThemedText style={styles.logoutIcon}>🚪</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.logoutText}>
                  Salir
                </ThemedText>
              </View>
            </Pressable>
          </View>

          <Pressable style={styles.uploadButton} onPress={pickImage}>
            <ThemedText type="defaultSemiBold" style={styles.uploadText}>
              Seleccionar Imagen
            </ThemedText>
          </Pressable>

          {/* Debug button to test API connection */}
          <Pressable 
            style={[styles.uploadButton, { backgroundColor: '#ff6b6b', marginTop: 10 }]} 
            onPress={async () => {
              try {
                console.log('Testing API connection to:', API_BASE_URL);
                const response = await fetch(`${API_BASE_URL}/docs`);
                console.log('API test response status:', response.status);
                Alert.alert('API Test', `Status: ${response.status}`);
              } catch (error) {
                console.error('API test error:', error);
              }
            }}
          >
            <ThemedText type="defaultSemiBold" style={styles.uploadText}>
              Test API Connection
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
        </View>
      </ThemedView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    flex: 1,
    zIndex: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00C2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 2,
  },
  userRole: {
    color: '#00C2FF',
    fontSize: 13,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutIcon: {
    fontSize: 16,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#00C2FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 20,
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
  },
  imageFrame: {
    width: '90%',
    height: 300,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00C2FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240,248,255,0.9)',
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
  },
  predictButton: {
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
});
import React, { useState } from 'react';
import { StyleSheet, View, Image, Pressable, Alert } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);

  const isJpg = (uri: string) => {
    const uriLower = uri.toLowerCase();
    return uriLower.endsWith('.jpg') || uriLower.endsWith('.jpeg');
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
      const selectedAsset = result.assets[0];
      if (selectedAsset.uri && isJpg(selectedAsset.uri)) {
        setImage(selectedAsset.uri);
      } else {
        Alert.alert('Error', 'Por favor toma una foto en formato JPG.');
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
      const selectedAsset = result.assets[0];
      if (selectedAsset.uri && isJpg(selectedAsset.uri)) {
        setImage(selectedAsset.uri);
      } else {
        Alert.alert('Error', 'Por favor selecciona solo imágenes JPG.');
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

  const handlePrediction = () => {
    Alert.alert('Predicción', 'Aquí se realizará la predicción con la imagen seleccionada.');
  };

  return (
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
        <Pressable style={styles.uploadButton} onPress={pickImage}>
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
              Aquí se mostrará la imagen JPG seleccionada
            </ThemedText>
          )}
        </View>

        {image && (
          <Pressable style={styles.predictButton} onPress={handlePrediction}>
            <ThemedText type="defaultSemiBold" style={styles.predictText}>
              Realizar Predicción
            </ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
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
  },
  predictText: {
    color: '#fff',
    fontSize: 16,
  },
});
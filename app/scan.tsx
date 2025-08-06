import React, { useState, useLayoutEffect } from 'react';
import { StyleSheet, View, Image, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ScanScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Predicción de Fracturas', // Aquí cambias el título del header
    });
  }, [navigation]);
  const [image, setImage] = useState<string | null>(null);

  // Función para validar que sea JPG o JPEG
  const isJpg = (uri: string) => {
    const uriLower = uri.toLowerCase();
    return uriLower.endsWith('.jpg') || uriLower.endsWith('.jpeg');
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
      const selectedAsset = result.assets[0];
      if (selectedAsset.uri && isJpg(selectedAsset.uri)) {
        setImage(selectedAsset.uri);
      } else {
        Alert.alert('Error', 'Por favor toma una foto en formato JPG.');
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
      const selectedAsset = result.assets[0];
      if (selectedAsset.uri && isJpg(selectedAsset.uri)) {
        setImage(selectedAsset.uri);
      } else {
        Alert.alert('Error', 'Por favor selecciona solo imágenes JPG.');
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

  const handlePrediction = () => {
    Alert.alert('Predicción', 'Aquí se realizará la predicción con la imagen seleccionada.');
  };

  return (
    <ThemedView style={styles.container}>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  uploadButton: {
    backgroundColor: '#00C2FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 40,
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
  },
  predictButton: {
    marginTop: 20,
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

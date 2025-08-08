import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/utils/auth';
import { API_BASE_URL } from '@/config/api';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<'tecnico' | 'medico'>('tecnico');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    if (!nombre.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Intentando registro con:', { email: email.trim(), nombre: nombre.trim(), rol });
      console.log('URL de API:', API_BASE_URL);
      
      const data = await authApi.register({
        email: email.trim(),
        nombre: nombre.trim(),
        rol,
        activo: true
      }, API_BASE_URL);
      
      console.log('Respuesta del registro:', data);
      
      await login(data.access_token, { 
        email: email.trim(), 
        rol: rol 
      });
      
      Alert.alert('Éxito', 'Registro exitoso', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (error) {
      console.error('Error en registro:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo completar el registro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ExpoImage
        source={require('@/assets/images/app_fracture_logo.png')}
        contentFit="cover"
        style={styles.backgroundImage}
      />

      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.registerCard}>
            <ThemedText type="title" style={styles.title}>
              Crear Cuenta
            </ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Email
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Nombre Completo
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu nombre completo"
                placeholderTextColor="#888"
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Rol
              </ThemedText>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={rol}
                  style={styles.picker}
                  onValueChange={(itemValue) => setRol(itemValue)}
                  enabled={!isLoading}
                >
                  <Picker.Item label="Técnico" value="tecnico" />
                  <Picker.Item label="Médico" value="medico" />
                </Picker>
              </View>
            </View>

            <Pressable 
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]} 
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText type="defaultSemiBold" style={styles.registerText}>
                  Crear Cuenta
                </ThemedText>
              )}
            </Pressable>

            <Pressable 
              style={styles.loginButton} 
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <ThemedText type="defaultSemiBold" style={styles.loginText}>
                ¿Ya tienes cuenta? Inicia sesión
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    zIndex: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    color: '#333',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#333',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#00C2FF',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerText: {
    color: '#fff',
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#00C2FF',
  },
  loginText: {
    color: '#00C2FF',
    fontSize: 16,
  },
});
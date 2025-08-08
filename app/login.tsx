import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/utils/auth';
import { API_BASE_URL } from '@/config/api';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Intentando login con:', email.trim());
      console.log('URL de API:', API_BASE_URL);
      
      const data = await authApi.login(email.trim(), API_BASE_URL);
      console.log('Respuesta del login:', data);
      
      await login(data.access_token, { email: email.trim() });
      
      Alert.alert('Éxito', 'Inicio de sesión exitoso', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo conectar al servidor');
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

      <View style={styles.content}>
        <View style={styles.loginCard}>
          <ThemedText type="title" style={styles.title}>
            Iniciar Sesión
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

          <Pressable 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText type="defaultSemiBold" style={styles.loginText}>
                Iniciar Sesión
              </ThemedText>
            )}
          </Pressable>

          <Pressable 
            style={styles.registerButton} 
            onPress={() => router.push('/register')}
            disabled={isLoading}
          >
            <ThemedText type="defaultSemiBold" style={styles.registerText}>
              ¿No tienes cuenta? Regístrate
            </ThemedText>
          </Pressable>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  content: {
    flex: 1,
    zIndex: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginCard: {
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
  loginButton: {
    backgroundColor: '#00C2FF',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
  },
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#00C2FF',
  },
  registerText: {
    color: '#00C2FF',
    fontSize: 16,
  },
});
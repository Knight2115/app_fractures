import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

export interface User {
  email: string;
  rol?: string;
}

export interface UserRegister {
  email: string;
  nombre: string;
  rol: 'tecnico' | 'medico';
  activo: boolean;
}

export interface RadiografiaResponse {
  id: string;
  message: string;
  data: {
    id: string;
    url: string;
    estado: string;
    usuario_id: string;
    fecha_captura: string;
    created_at: string;
    filename: string;
    content_type: string;
    file_size: number;
    prediccion?: {
      etiqueta: string;
      probabilidad: number;
      confianza_porcentaje: number;
      umbral_usado: number;
      resultado_binario: string;
    };
    resultado_id?: string;
  };
}

export interface ValidationRequest {
  validado: boolean;
  nueva_etiqueta?: string;
  observacion?: string;
}

export interface ValidationResponse {
  message: string;
  resultado_id: string;
  validado_por: string;
  validado: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export const authStorage = {
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};

// Función helper para hacer requests con retry
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to ${url}`);
      const response = await fetch(url, options);
      console.log(`Attempt ${attempt} - Status: ${response.status}`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Attempt ${attempt} failed:`, errorMessage);
      lastError = error;
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export const authApi = {
  async login(email: string, apiUrl: string): Promise<{ access_token: string; token_type: string }> {
    const response = await fetchWithRetry(`${apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al iniciar sesión');
    }

    return await response.json();
  },

  async register(userData: UserRegister, apiUrl: string): Promise<{ access_token: string; token_type: string }> {
    const response = await fetchWithRetry(`${apiUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al registrar usuario');
    }

    return await response.json();
  },

  async uploadRadiografia(
    imageUri: string, 
    filename: string, 
    apiUrl: string, 
    token: string
  ): Promise<RadiografiaResponse> {
    console.log('=== UPLOAD DEBUG ===');
    console.log('Image URI:', imageUri);
    console.log('Filename:', filename);
    console.log('API URL:', apiUrl);
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
    
    const formData = new FormData();
    
    // Detect image type based on filename
    const imageType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    console.log('Image type:', imageType);
    
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: imageType,
    } as any);
    
    formData.append('estado', 'pendiente');
    
    console.log('FormData created, making request to:', `${apiUrl}/radiografias`);

    try {
      const response = await fetchWithRetry(`${apiUrl}/radiografias`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let the browser set it
        },
        body: formData,
      }, 3); // Try up to 3 times for image uploads

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response text:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || 'Error al subir radiografía');
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      return result;
      
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  async validateResultado(
    resultadoId: string,
    validation: ValidationRequest,
    apiUrl: string,
    token: string
  ): Promise<ValidationResponse> {
    console.log('=== VALIDATE DEBUG ===');
    console.log('Resultado ID:', resultadoId);
    console.log('Validation data:', validation);
    console.log('API URL:', apiUrl);
    
    const response = await fetchWithRetry(`${apiUrl}/resultados/${resultadoId}/validar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validation),
    });

    console.log('Validation response status:', response.status);
    console.log('Validation response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Validation error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || 'Error al validar resultado');
      } catch {
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('Validation successful:', result);
    return result;
  },

  async logout(): Promise<void> {
    await authStorage.removeToken();
  }
};
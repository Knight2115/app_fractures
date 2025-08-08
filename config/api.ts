const getApiUrl = () => {
  if (__DEV__) {
    // Usar IP real para todos los dispositivos (emuladores y físicos)
    return 'https://api-ia-deteccion-fracturas-419197568588.us-central1.run.app';
  }
  
  return 'https://api-ia-deteccion-fracturas-419197568588.us-central1.run.app';
};

export const API_BASE_URL = getApiUrl();
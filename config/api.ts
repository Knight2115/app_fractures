const getApiUrl = () => {
  if (__DEV__) {
    // Usar IP real para todos los dispositivos (emuladores y físicos)
    return 'http://192.168.1.221:8000';
  }
  
  return 'https://your-production-api.com';
};

export const API_BASE_URL = getApiUrl();
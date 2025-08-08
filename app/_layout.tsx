import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AuthProvider } from '@/contexts/AuthContext';
import 'react-native-reanimated';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            contentStyle: {
              backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
            },
            animation: 'slide_from_right',
            gestureEnabled: true,
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#000' : '#121212',
            },
            headerTintColor: colorScheme === 'dark' ? '#fff' : '#eee',
          }}
        >
          <Stack.Screen 
            name="login" 
            options={{ 
              headerShown: true,
              title: "Iniciar Sesión"
            }} 
          />
          <Stack.Screen 
            name="register" 
            options={{ 
              headerShown: true,
              title: "Crear Cuenta"
            }} 
          />
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: true,
              title: "Predicción de Fracturas",
              headerBackVisible: false,
              gestureEnabled: false,
            }} 
          />
          <Stack.Screen 
            name="scan" 
            options={{ 
              headerShown: true,
              title: "Escanear Radiografía"
            }} 
          />
          <Stack.Screen 
            name="validation" 
            options={{ 
              headerShown: true,
              title: "Validación Médica",
              headerBackVisible: false,
              gestureEnabled: false,
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

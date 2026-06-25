import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import SplashScreen from 'react-native-splash-screen-newarch';

import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hide({ animation: 'scaleFade', duration: 2500, scale: 1.5 });
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppTabs />
    </ThemeProvider>
  );
}

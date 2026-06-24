import { useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen-newarch';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    SplashScreen.hide({ animation: 'scaleFade', duration: 500, scale: 1.5 });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: safeAreaInsets.top,
          paddingBottom: safeAreaInsets.bottom,
        },
      ]}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Splash Screen Example</Text>
        <Text style={styles.title}>react-native-splash-screen-newarch</Text>
        <Text style={styles.body}>
          The native splash screen is shown before React Native renders, then
          hidden from JavaScript with a scaleFade animation.
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
            {
              "SplashScreen.hide({ animation: 'scaleFade', duration: 500, scale: 1.12 })"
            }
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F2',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: '#2F6F73',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  title: {
    color: '#151515',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 16,
  },
  body: {
    color: '#42423B',
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 24,
  },
  codeBlock: {
    backgroundColor: '#151515',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  code: {
    color: '#F7F7F2',
    fontFamily: 'Courier',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default App;

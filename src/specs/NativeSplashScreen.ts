import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  show(): void;
  hide(animation: string, duration: number, scale: number): void;
}

export default TurboModuleRegistry.get<Spec>('SplashScreen');

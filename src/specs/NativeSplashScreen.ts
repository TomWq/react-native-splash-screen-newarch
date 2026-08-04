import type { TurboModule } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  show(): void;
  hide(animation: string, duration: number, scale: number, easing: string): void;
  getStartupMetrics(): Promise<UnsafeObject>;
}

export default TurboModuleRegistry.get<Spec>('SplashScreen');

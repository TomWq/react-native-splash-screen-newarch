import { NativeModules, Platform } from 'react-native';
import NativeSplashScreen from './specs/NativeSplashScreen';

export type HideAnimation =
  | 'none'
  | 'fade'
  | 'scaleFade'
  | 'slideUpFade'
  | 'zoomOutFade';
export type HideEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface HideOptions {
  animation?: HideAnimation;
  duration?: number;
  scale?: number;
  easing?: HideEasing;
}

export interface StartupMetrics {
  showTime: number | null;
  hideRequestedTime: number | null;
  hiddenTime: number | null;
  nativeVisibleDuration: number | null;
  hideDuration: number | null;
}

export interface SplashScreenModule {
  hide(options?: HideOptions): void;
  show(): void;
  getStartupMetrics(): Promise<StartupMetrics>;
}

type NativeSplashScreenModule = {
  hide(animation: string, duration: number, scale: number, easing: string): void;
  show(): void;
  getStartupMetrics?: () => Promise<unknown>;
};

const NativeModule =
  NativeSplashScreen ??
  (NativeModules.SplashScreen as NativeSplashScreenModule | undefined);

const DEFAULT_HIDE_OPTIONS = {
  animation: 'none',
  duration: 0,
  scale: 1,
  easing: 'easeOut',
} as const;
const DEFAULT_ANIMATION_DURATION = 250;
const DEFAULT_SCALE_FADE_TARGET = 1.08;
const MIN_SCALE_FADE_TARGET = 1;
const MAX_SCALE_FADE_TARGET = 1.3;
const DEFAULT_ZOOM_OUT_FADE_TARGET = 0.92;
const MIN_ZOOM_OUT_FADE_TARGET = 0.7;
const MAX_ZOOM_OUT_FADE_TARGET = 1;
let didReportMissingNativeModule = false;

const EMPTY_STARTUP_METRICS: StartupMetrics = {
  showTime: null,
  hideRequestedTime: null,
  hiddenTime: null,
  nativeVisibleDuration: null,
  hideDuration: null,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeHideOptions(options?: HideOptions) {
  if (!options || typeof options !== 'object') {
    return DEFAULT_HIDE_OPTIONS;
  }

  const animation =
    options.animation === 'fade' ||
    options.animation === 'scaleFade' ||
    options.animation === 'slideUpFade' ||
    options.animation === 'zoomOutFade'
      ? options.animation
      : 'none';
  const hasAnimation = animation !== 'none';
  const duration = hasAnimation
    ? Number.isFinite(options.duration)
      ? Math.max(0, options.duration as number)
      : DEFAULT_ANIMATION_DURATION
    : 0;
  let scale = 1;
  if (animation === 'scaleFade') {
    scale = Number.isFinite(options.scale)
      ? clamp(options.scale as number, MIN_SCALE_FADE_TARGET, MAX_SCALE_FADE_TARGET)
      : DEFAULT_SCALE_FADE_TARGET;
  } else if (animation === 'zoomOutFade') {
    scale = Number.isFinite(options.scale)
      ? clamp(options.scale as number, MIN_ZOOM_OUT_FADE_TARGET, MAX_ZOOM_OUT_FADE_TARGET)
      : DEFAULT_ZOOM_OUT_FADE_TARGET;
  }

  const easing =
    options.easing === 'linear' ||
    options.easing === 'easeIn' ||
    options.easing === 'easeInOut'
      ? options.easing
      : 'easeOut';

  return { animation, duration, scale, easing };
}

function reportMissingNativeModule(): void {
  if (
    didReportMissingNativeModule ||
    Platform.OS === 'web' ||
    typeof __DEV__ === 'undefined' ||
    !__DEV__
  ) {
    return;
  }

  didReportMissingNativeModule = true;
  console.error(
    '[react-native-splash-screen-newarch] Native module "SplashScreen" is unavailable. Rebuild the native app after installing the package, run "pod install" for React Native CLI iOS projects, and use an Expo development build instead of Expo Go.'
  );
}

function readMetric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function normalizeStartupMetrics(value: unknown): StartupMetrics {
  if (!value || typeof value !== 'object') {
    return { ...EMPTY_STARTUP_METRICS };
  }

  const metrics = value as Record<string, unknown>;
  return {
    showTime: readMetric(metrics.showTime),
    hideRequestedTime: readMetric(metrics.hideRequestedTime),
    hiddenTime: readMetric(metrics.hiddenTime),
    nativeVisibleDuration: readMetric(metrics.nativeVisibleDuration),
    hideDuration: readMetric(metrics.hideDuration),
  };
}

const SplashScreen: SplashScreenModule = {
  show() {
    if (!NativeModule) {
      reportMissingNativeModule();
      return;
    }

    NativeModule.show();
  },

  hide(options) {
    const { animation, duration, scale, easing } = normalizeHideOptions(options);
    if (!NativeModule) {
      reportMissingNativeModule();
      return;
    }

    NativeModule.hide(animation, duration, scale, easing);
  },

  getStartupMetrics() {
    if (!NativeModule) {
      reportMissingNativeModule();
      return Promise.resolve({ ...EMPTY_STARTUP_METRICS });
    }

    if (typeof NativeModule.getStartupMetrics !== 'function') {
      return Promise.resolve({ ...EMPTY_STARTUP_METRICS });
    }

    return Promise.resolve(NativeModule.getStartupMetrics()).then(
      normalizeStartupMetrics
    );
  },
};

export default SplashScreen;

import { NativeModules } from 'react-native';
import NativeSplashScreen from './specs/NativeSplashScreen';

export type HideAnimation = 'none' | 'fade' | 'scaleFade';

export interface HideOptions {
  animation?: HideAnimation;
  duration?: number;
  scale?: number;
}

export interface SplashScreenModule {
  hide(options?: HideOptions): void;
  show(): void;
}

type NativeSplashScreenModule = {
  hide(animation: string, duration: number, scale: number): void;
  show(): void;
};

const NativeModule =
  NativeSplashScreen ??
  (NativeModules.SplashScreen as NativeSplashScreenModule | undefined);

const DEFAULT_HIDE_OPTIONS = {
  animation: 'none',
  duration: 0,
  scale: 1,
} as const;
const DEFAULT_ANIMATION_DURATION = 400;
const DEFAULT_SCALE_FADE_TARGET = 1.08;
const MIN_SCALE_FADE_TARGET = 1;
const MAX_SCALE_FADE_TARGET = 1.3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeHideOptions(options?: HideOptions) {
  if (!options || typeof options !== 'object') {
    return DEFAULT_HIDE_OPTIONS;
  }

  const animation =
    options.animation === 'fade' || options.animation === 'scaleFade'
      ? options.animation
      : 'none';
  const duration = Number.isFinite(options.duration)
    ? Math.max(0, options.duration as number)
    : animation === 'fade' || animation === 'scaleFade'
      ? DEFAULT_ANIMATION_DURATION
      : 0;
  const scale =
    animation === 'scaleFade' && Number.isFinite(options.scale)
      ? clamp(options.scale as number, MIN_SCALE_FADE_TARGET, MAX_SCALE_FADE_TARGET)
      : animation === 'scaleFade'
        ? DEFAULT_SCALE_FADE_TARGET
        : 1;

  return { animation, duration, scale };
}

const SplashScreen: SplashScreenModule = {
  show() {
    NativeModule?.show();
  },

  hide(options) {
    const { animation, duration, scale } = normalizeHideOptions(options);
    NativeModule?.hide(animation, duration, scale);
  },
};

export default SplashScreen;

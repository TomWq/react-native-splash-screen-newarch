---
title: API reference
description: show, hide, transition options, and startup metric types for react-native-splash-screen-newarch.
---

# API reference

```ts
import SplashScreen from 'react-native-splash-screen-newarch';
```

## `SplashScreen.show()`

```ts
SplashScreen.show(): void;
```

Displays the native splash view again using the app's configured platform resources. The normal startup path shows natively before JavaScript loads, so application code usually only calls `hide()`.

Android system mode cannot display the splash again after startup.

## `SplashScreen.hide(options?)`

```ts
SplashScreen.hide(options?: HideOptions): void;
```

Removes the native splash view. Omitting options removes it immediately without animation.

```ts
type HideAnimation =
  | 'none'
  | 'fade'
  | 'scaleFade'
  | 'slideUpFade'
  | 'zoomOutFade';

type HideEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

type HideOptions = {
  animation?: HideAnimation;
  duration?: number;
  scale?: number;
  easing?: HideEasing;
};
```

| Option | Default | Description |
| --- | --- | --- |
| `animation` | `none` | Hide transition |
| `duration` | `250` when animated; `0` for `none` | Milliseconds; negative values become `0` |
| `scale` | `scaleFade: 1.08`; `zoomOutFade: 0.92` | Ignored by other transitions |
| `easing` | `easeOut` | Transition timing |

Unknown animation names fall back to `none`. `scaleFade` is clamped to `1.0`-`1.3`; `zoomOutFade` is clamped to `0.7`-`1.0`.

## `SplashScreen.getStartupMetrics()`

```ts
SplashScreen.getStartupMetrics(): Promise<StartupMetrics>;
```

```ts
type StartupMetrics = {
  showTime: number | null;
  hideRequestedTime: number | null;
  hiddenTime: number | null;
  nativeVisibleDuration: number | null;
  hideDuration: number | null;
};
```

Returns native monotonic timestamps in milliseconds and derived durations. A phase that has not occurred, or is unavailable in the running native build, is `null`.

These values describe this package's native splash view, not total startup or time to interactive.

## Missing native module

In development, the package reports one clear error if the app was not rebuilt after installation. Web and production do not repeatedly log the warning; calls return safely, and the metrics API returns an object containing only `null` values.

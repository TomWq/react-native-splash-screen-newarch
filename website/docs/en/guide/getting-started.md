---
title: Quick start
description: Install react-native-splash-screen-newarch, choose Expo or React Native CLI setup, and hide the native splash when the first screen is ready.
---

# Quick start

`react-native-splash-screen-newarch` keeps native launch artwork visible while React Native initializes. JavaScript calls `hide()` only after the first screen is ready, producing a continuous handoff to React UI.

## Requirements

| Target | Requirement |
| --- | --- |
| React Native | 0.76 or newer |
| Expo | SDK 52 or newer with prebuild or a development build |
| Android | `minSdkVersion` 24 by default |
| iOS | 15.1 or newer |

::: warning Expo Go is not supported
This package includes Android and iOS native code. Expo projects must generate and rebuild a development client.
:::

## Install

```bash
npm install react-native-splash-screen-newarch
```

React Native CLI iOS projects also need CocoaPods:

```bash
cd ios
pod install
cd ..
```

## Choose a setup path

| Project | Next step |
| --- | --- |
| Expo prebuild / development build | Use the [Expo config plugin](./expo) |
| React Native CLI Android | Complete the [Android setup](./android) |
| React Native CLI iOS | Complete the [iOS setup](./ios) |

## Hide when the first screen is ready

Wait for navigation, fonts, and data needed by the initial render before calling `hide()`:

```tsx
import { useEffect } from 'react';
import SplashScreen from 'react-native-splash-screen-newarch';

export default function App() {
  useEffect(() => {
    SplashScreen.hide({
      animation: 'zoomOutFade',
      duration: 250,
      scale: 0.92,
      easing: 'easeOut',
    });
  }, []);

  return null;
}
```

Calling `hide()` too early can expose an unrendered root view. Calling it too late makes the app feel stuck. Use first-screen readiness as the boundary instead of a fixed delay.

## Rebuild the native app

Metro refreshes cannot apply a newly installed native module or changed launch resources:

```bash
# Expo
npx expo prebuild
npx expo run:android
# or npx expo run:ios

# React Native CLI
npx react-native run-android
# or npx react-native run-ios
```

## Next steps

- For the fastest Android path, read [Startup performance](./performance).
- For full-screen artwork and transitions, read [Hide transitions](./animations).
- For every option and return type, open the [API reference](/en/api/).

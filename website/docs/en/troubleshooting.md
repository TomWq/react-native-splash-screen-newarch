---
title: Troubleshooting
description: Diagnose Expo config plugin, native module, Android theme, iOS cache, transition, and blank-screen issues.
---

# Troubleshooting

## Native module is unavailable

Typical message:

```text
Native module "SplashScreen" is unavailable
```

Check that the native app was rebuilt after installation, React Native CLI iOS ran `pod install`, Expo is using a development build instead of Expo Go, and Metro is connected to the newly built app rather than an older installation.

## Expo reports an invalid config plugin

Typical error:

```text
Package "react-native-splash-screen-newarch" does not contain a valid config plugin.
Unexpected token 'typeof'
```

This usually means Expo did not resolve the package's root `app.plugin.js`, then incorrectly fell back to the React Native entry point where Node encountered Flow syntax.

Inspect the installed version and plugin export:

```bash
npm ls react-native-splash-screen-newarch
node -e "console.log(typeof require('react-native-splash-screen-newarch/app.plugin'))"
npx expo config --type introspect
```

The export should be `function`. Use the current 2.x package, ensure the dependency installation is complete, and reference the package name directly in `plugins` rather than its React Native `index.js`.

## Expo changes are missing from native projects

- Run `npx expo prebuild` after changing app configuration.
- Rebuild the development client; Metro refresh cannot apply native changes.
- Check whether another `app.config.js` overrides the edited configuration.
- Use `npx expo config --type introspect` to inspect resolved configuration.

## Android artwork is missing

- The resource name must be exactly `launch_screen`.
- Check `res/layout/launch_screen.xml`, `res/drawable/launch_screen.*`, or `res/mipmap/launch_screen.*`.
- Ensure every drawable referenced by XML exists.
- Use `.9.png` as a background instead of a regular `ImageView.src`.
- Rebuild the Android app after resource changes.

## Android reports an AppCompat theme error

The host theme must match the `ReactActivity` base class. AppCompat activities should inherit an AppCompat theme. In system mode, `postSplashScreenTheme` must point to the correct app theme.

## Android 12+ flashes a solid color

Android owns the earliest launch phase. Match `windowSplashScreenBackground` to the full-screen artwork background. Dialog content can only take over after the activity starts.

You can test `android:windowIsTranslucent=true`, but it can affect task and background-launch behavior and needs device validation before production use.

## iOS cannot find `rnsplashscreen`

```bash
cd ios
pod install
```

Then open the `.xcworkspace`, clean, and rebuild. If stale symbols remain, inspect Podfile.lock and the target's linked frameworks.

## iOS artwork changes do not appear

iOS caches Launch Screens. Delete the app from the simulator or device, clean the build folder, then install again. An overwrite install often does not refresh the system cache.

## A blank screen appears after launch

`hide()` is running too early. Wait for navigation, fonts, and essential first-screen data. Avoid hiding state uncertainty behind a fixed delay.

## A transition does not play

- Android system mode does not run custom transitions.
- `animation: 'none'` or `duration: 0` removes immediately.
- Reduce Motion and disabled system animations are respected.
- Check the animation name against the [API reference](/en/api/).

## Startup metrics are `null`

The phase may not have happened, or the installed native app may predate the metrics API. Rebuild the app and read metrics after `hide()` completes.

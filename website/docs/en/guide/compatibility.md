---
title: Compatibility and modes
description: Check React Native, Expo, Android, and iOS support, then choose Android system or dialog mode.
---

# Compatibility and modes

## Supported targets

| Target | Range | Notes |
| --- | --- | --- |
| React Native | 0.76+ | TurboModule through codegen, with Bridge fallback where the Legacy Architecture remains available |
| Expo | SDK 52+ | Prebuild, development builds, and EAS Build only |
| Android | API 24+ | Android 12+ always owns the earliest launch phase |
| iOS | 15.1+ | The system Launch Screen must remain static |

React Native 0.82 and newer only provide the New Architecture. The package keeps the same JavaScript API across the TurboModule and Bridge fallback paths.

## Upgrading from 1.x

Version 2.x changed the native Android and iOS package names. If Android reports `Unresolved reference 'devio'`, `SplashScreen`, or `SplashScreenReactPackage`, update the old import to:

```kotlin
import com.tomwq.rnsplashscreen.SplashScreen
```

If the project manually registers `SplashScreenReactPackage`, update it to `com.tomwq.rnsplashscreen.SplashScreenReactPackage`. Current React Native templates usually autolink the package, so remove the manual registration unless the project specifically needs it. Clean and rebuild the native app after updating the imports.

## Android mode comparison

| Capability | `system` | `dialog` (default) |
| --- | --- | --- |
| Startup work | Lowest | Inflates a layout and creates a native Dialog |
| Artwork | Centered logo and solid color | Centered logo, full-screen artwork, or NinePatch |
| Custom hide transition | No; exits the system splash directly | Yes |
| `show()` after startup | No | Yes |
| Android 12+ visual model | Closest to the system model | Switches to full-screen content after the system phase |

### Choose `system`

Prefer system mode when startup speed matters more than full-screen creative control, the design is a centered logo on a solid color, and the app does not need Android hide transitions or `show()` after startup.

### Choose `dialog`

Keep dialog mode for full-screen artwork, `.9.png` or custom XML layouts, animated exits, or flows that show the native splash again.

## Artwork constraints

Android system splash icons have size and mask constraints. Do not pass a full-screen poster as `windowSplashScreenAnimatedIcon`. Use dialog mode for full-screen artwork. For system mode, provide a logo with transparent padding and verify it across densities and Android 12+ devices.

iOS Launch Screens cannot run animation, web content, or runtime code. iOS transitions run on the native overlay created after launch.

## Expo versus React Native CLI

The Expo config plugin updates `MainActivity`, `AppDelegate`, themes, and assets. React Native CLI projects maintain those files manually. Avoid inserting both manual and plugin-generated native calls into the same generated project.

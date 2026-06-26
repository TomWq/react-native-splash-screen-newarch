# react-native-splash-screen-newarch

[![License MIT](http://img.shields.io/badge/license-MIT-orange.svg?style=flat)](./LICENSE)

Language: [English](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/README.md) | [简体中文](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/README.zh.md)

面向新版 React Native 的全屏启动屏库，基于经典 `react-native-splash-screen` API 升级。

A full-screen splash screen package for recent React Native apps. It keeps the familiar `show()` / `hide()` API, supports TurboModule through React Native codegen, keeps a bridge fallback for non-New-Architecture builds, and adds Expo config plugin support.

## Features

- Works with recent React Native projects without forcing `react-native >= 0.84.0`.
- Supports New Architecture / TurboModule and keeps a bridge compatibility layer.
- Provides `hide({ animation })` with `none`, `fade`, and configurable `scaleFade`.
- Android can use `launch_screen.xml`, or fall back to a native fullscreen view when no XML layout exists.
- Android fullscreen mode supports display cutout handling on Android P and newer.
- iOS follows the current Apple Launch Screen model: static launch screen in Xcode, then this package keeps it visible until your JS calls `hide()`.
- Expo config plugin can patch Android `MainActivity`, iOS `AppDelegate`, and optionally create the Android launch layout.

## Compatibility

- Package: `react-native-splash-screen-newarch@2.x`
- React Native peer dependency: `*`
- Android: `minSdkVersion` 24 by default
- iOS: 15.1+
- Expo: prebuild / development-client projects only. Expo Go is not supported because this package contains native code.

The example app may use a newer React Native version as a validation target, but the published package does not declare a hard peer dependency on that exact version.

## Upgrading from 1.x to 2.x

Version 2.x includes native namespace and module-name changes. If your app already integrated 1.x manually, update the native imports before rebuilding.

### Native import changes

| Area | 1.x | 2.x |
| --- | --- | --- |
| Android Kotlin / Java import | `org.devio.rn.splashscreen.SplashScreen` | `com.tomwq.rnsplashscreen.SplashScreen` |
| Android library namespace | `org.devio.rn.splashscreen` | `com.tomwq.rnsplashscreen` |
| iOS Swift import | `import react_native_splash_screen` | `import rnsplashscreen` |
| iOS Objective-C header | `#import <react_native_splash_screen/RNSplashScreen.h>` | `#import <rnsplashscreen/RNSplashScreen.h>` |
| CocoaPods spec file | `react-native-splash-screen.podspec` | `react-native-splash-screen-newarch.podspec` |

The JavaScript package import stays the same:

```ts
import SplashScreen from 'react-native-splash-screen-newarch';
```

### What changed in 2.x

- The podspec file was renamed to `react-native-splash-screen-newarch.podspec` to match the package name.
- Android no longer exposes the old `org.devio.rn.splashscreen` package path.
- iOS now exposes the Swift module as `rnsplashscreen`.
- `hide(options)` now supports `fade` and `scaleFade` animations.
- Android no longer requires an AppCompat-based theme from this package.
- Android can fall back to a native fullscreen view when `launch_screen.xml` is missing.
- Expo projects can use the included config plugin instead of patching native files by hand.

After upgrading, run a clean native install:

```bash
cd ios
pod install
```

If Xcode or Gradle still resolves old native symbols, clean derived data / build folders and rebuild the app.

## Installation

```bash
npm install react-native-splash-screen-newarch
```

For iOS React Native CLI projects, install pods after adding the package:

```bash
cd ios
pod install
```

## JavaScript Usage

Call `hide()` after your first screen is ready. If you hide the splash screen too early, users may see a blank root view while navigation, fonts, or initial data are still loading.

```tsx
import { useEffect } from 'react';
import SplashScreen from 'react-native-splash-screen-newarch';

export default function App() {
  useEffect(() => {
    SplashScreen.hide({ animation: 'scaleFade', duration: 500, scale: 1.12 });
  }, []);

  return null;
}
```

## Expo Setup

Add the config plugin to `app.json` or `app.config.js`, then run `npx expo prebuild` and rebuild your development client.

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-splash-screen-newarch",
        {
          "image": "./assets/splash.png",
          "backgroundColor": "#000000",
          "resizeMode": "contain",
          "android": {
            "fullScreen": true,
            "createLayout": true,
            "image": "./assets/splash.png",
            "backgroundColor": "#000000",
            "imageResizeMode": "centerCrop",
            "windowIsTranslucent": false
          },
          "ios": {
            "image": "./assets/splash.png",
            "backgroundColor": "#000000",
            "resizeMode": "contain"
          }
        }
      ]
    ]
  }
}
```

Plugin options:

| Option | Default | Description |
| --- | --- | --- |
| `image` | `null` | Shared splash image used by Android and iOS unless a platform-specific image is set. |
| `backgroundColor` | `#000000` | Shared splash background color used by Android and iOS unless a platform-specific color is set. |
| `resizeMode` | `contain` | Shared iOS image content mode. Use `contain` or `cover`. |
| `android` | `true` | Set to `false` to skip Android patching. It can also be an object with Android options. |
| `ios` | `true` | Set to `false` to skip iOS patching. It can also be an object with iOS options. |
| `android.fullScreen` | `true` | Calls `SplashScreen.show(this, true)` in `MainActivity`. |
| `android.createLayout` | `true` | Creates `android/app/src/main/res/layout/launch_screen.xml` when missing, plus Android 12+ system splash resources and activity theme. |
| `android.overwriteLayout` | `false` | Allows the plugin to replace an existing Android launch layout. |
| `android.image` | `null` | Copies a `.png`, `.jpg`, `.jpeg`, `.webp`, or `.xml` file to `@drawable/launch_screen`. |
| `android.backgroundColor` | `#000000` | Background color for the generated Android launch layout. |
| `android.imageResizeMode` | `centerCrop` | Android `ImageView.scaleType` for the generated layout. |
| `android.systemImage` | `false` | Uses the splash image as the Android 12+ system splash icon. Keep this `false` for full-screen artwork because Android constrains this field to icon size. |
| `android.windowIsTranslucent` | `false` | Makes the Android system starting window transparent to avoid a solid-color pre-splash frame. Test cold start, recents, and background launch behavior on target devices before enabling. |
| `ios.image` | `null` | Copies a `.png`, `.jpg`, `.jpeg`, or `.pdf` file to `Images.xcassets/SplashScreenImage.imageset`. |
| `ios.backgroundColor` | `#000000` | Creates `Images.xcassets/SplashScreenBackground.colorset` and uses it in the launch storyboard. |
| `ios.resizeMode` | `contain` | Uses `scaleAspectFit` for `contain` and `scaleAspectFill` for `cover`. |

On Android, the generated `Theme.App.SplashScreen` handles the earliest Android 12+ system splash phase. Android constrains `windowSplashScreenAnimatedIcon` to icon size, so the plugin defaults that icon to transparent and uses the configured background color for the system phase. Enable `android.windowIsTranslucent` if you prefer to avoid seeing that solid-color system frame. The full-screen `launch_screen.xml` layout is then used by this package after `MainActivity` starts, keeping the splash visible until your JavaScript calls `hide()`.

On iOS, the plugin sets `UILaunchStoryboardName` to `SplashScreen`, creates `SplashScreen.storyboard`, adds it to the Xcode project resources, and inserts the native `RNSplashScreen.show()` call. If no iOS image is configured, the generated storyboard uses only the configured background color.

## Android Setup

If you are not using the Expo plugin, add the native call manually.

### Kotlin

Call `SplashScreen.show(this, true)` before `super.onCreate(savedInstanceState)`.

```kotlin
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.tomwq.rnsplashscreen.SplashScreen

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreen.show(this, true)
    super.onCreate(savedInstanceState)
  }
}
```

### Java

```java
import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.tomwq.rnsplashscreen.SplashScreen;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    SplashScreen.show(this, true);
    super.onCreate(savedInstanceState);
  }
}
```

### Android Launch Layout

The library looks for `android/app/src/main/res/layout/launch_screen.xml`. If the layout exists, it is used as the fullscreen splash content.

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#000000">

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:scaleType="centerCrop"
        android:src="@drawable/launch_screen" />
</FrameLayout>
```

### Android No-XML Fallback

If `launch_screen.xml` does not exist, the library creates a lightweight native `FrameLayout` at runtime. It then looks for an image named `launch_screen` in `drawable` first, then in `mipmap`.

Recommended fallback layout:

```text
android/app/src/main/res/drawable/launch_screen.png
```

If neither a layout nor image resource exists, Android shows a fullscreen black background until `hide()` runs.

### Android 12+ System Splash Note

Android owns the earliest system splash phase on Android 12 and newer. This package takes over immediately after your `Activity` starts, so it can show a full-screen layout or image during React Native startup. Expo projects can set `android.windowIsTranslucent` in the plugin options to avoid a solid-color system frame before this package takes over.

For manually configured Android projects, you can test the equivalent launch theme item:

```xml
<item name="android:windowIsTranslucent">true</item>
```

Use translucency only after testing cold start, back stack behavior, recents, and theme transitions on your target Android versions.

This package does not require AppCompat internally. However, your host app theme must still match your `Activity` base class. If your React Native template uses an AppCompat-backed `ReactActivity`, keep your app theme as an AppCompat descendant, for example `Theme.AppCompat.DayNight.NoActionBar`; otherwise Android can crash with `You need to use a Theme.AppCompat theme (or descendant) with this activity.`

## iOS Setup

iOS launch screens are static system UI. Apple expects the launch screen to be defined with a storyboard or launch screen file selected by `UILaunchStoryboardName`; custom code, networking, timers, and runtime animations do not run inside the system launch screen.

This package works with that model:

1. Xcode renders your static `LaunchScreen.storyboard` while the app starts.
2. `RNSplashScreen.show()` creates an overlay window from `UILaunchStoryboardName` and keeps that overlay visible while React Native loads.
3. Your JavaScript calls `SplashScreen.hide()` when the first screen is ready, and the overlay is removed with the selected animation.

### Configure the Launch Screen in Xcode

1. Open `ios/YourApp.xcworkspace` in Xcode.
2. Add your splash image to `Assets.xcassets`. Use an Image Set such as `SplashLogo` or a full-screen image such as `LaunchScreenBackground`.
3. Open `LaunchScreen.storyboard`. If your project does not have one, create a new storyboard named `LaunchScreen.storyboard`.
4. Set the root view background color to match your brand or app background.
5. Add an `Image View` for the logo or full-screen image.
6. For a centered logo, constrain the image view to the center of the root view and give it explicit width / height constraints.
7. For a full-screen image, pin the image view to the root view edges and set the content mode to `Aspect Fill`.
8. Select your app target, open `General` > `App Icons and Launch Screen`, and set `Launch Screen File` to `LaunchScreen`.
9. If you manage `Info.plist` manually, make sure `UILaunchStoryboardName` is set to `LaunchScreen`.
10. Make sure the storyboard and image assets are included in your app target membership.

During development, iOS may cache launch screen assets. If a change does not appear, delete the app from the simulator or device, clean the build folder, then rebuild.

On iOS, `fade` and `scaleFade` animate the overlay window created from your launch storyboard. The system launch screen itself is static and cannot run custom animations.

### Swift AppDelegate

Import the module:

```swift
import rnsplashscreen
```

Call `RNSplashScreen.show()` after React Native starts and before `application(_:didFinishLaunchingWithOptions:)` returns.

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import rnsplashscreen

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "YourAppName",
      in: window,
      launchOptions: launchOptions
    )

    RNSplashScreen.show()
    return true
  }
}
```

### Objective-C AppDelegate

```objc
#import <rnsplashscreen/RNSplashScreen.h>
```

Call before returning `YES` from `application:didFinishLaunchingWithOptions:`.

```objc
[RNSplashScreen show];
return YES;
```

## API

```ts
type HideAnimation = 'none' | 'fade' | 'scaleFade';

type HideOptions = {
  animation?: HideAnimation;
  duration?: number;
  scale?: number;
};

SplashScreen.show(): void;
SplashScreen.hide(options?: HideOptions): void;
```

`duration` is in milliseconds. `scale` only affects `scaleFade`; it is clamped to `1.0` - `1.3`.

| Call | Behavior |
| --- | --- |
| `SplashScreen.hide()` | Hides immediately. |
| `SplashScreen.hide({ animation: 'none' })` | Hides immediately. |
| `SplashScreen.hide({ animation: 'fade' })` | Fades out with the default `400ms` duration. |
| `SplashScreen.hide({ animation: 'scaleFade' })` | Fades out with the default `400ms` duration and `1.08` scale target. |
| `SplashScreen.hide({ animation: 'scaleFade', duration: 500, scale: 1.12 })` | Uses a more visible scale-fade transition. |

On Android, animated hide is applied to the splash content view. The dialog window itself is transparent and has no dim layer, so the app content can appear directly behind the fading splash screen instead of flashing through a black dialog background.

On iOS, animated hide is applied to the launch storyboard overlay window that `RNSplashScreen.show()` adds above the app window.

## Troubleshooting

- iOS cannot find `rnsplashscreen`: run `cd ios && pod install`, then clean and rebuild the app.
- iOS launch image changes do not appear: delete the app from the simulator or device because iOS may cache launch screen assets.
- Android image does not appear: ensure the resource name is exactly `launch_screen` and is placed in `drawable`, `mipmap`, or referenced from `layout/launch_screen.xml`.
- Expo changes do not apply: run `npx expo prebuild` again and rebuild the native app or development client.
- The splash screen hides too early: move `SplashScreen.hide()` until after navigation, fonts, and first-screen data are ready.

## References

- [Apple Human Interface Guidelines: Launching](https://developer.apple.com/design/human-interface-guidelines/launching)
- [Apple Info.plist key: UILaunchStoryboardName](https://developer.apple.com/documentation/bundleresources/information-property-list/uilaunchstoryboardname)

## License

MIT

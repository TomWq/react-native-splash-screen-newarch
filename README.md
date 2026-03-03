# react-native-splash-screen-newarch

[![English](https://img.shields.io/badge/Language-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/%E8%AF%AD%E8%A8%80-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-brightgreen)](./README.zh.md)

[![License MIT](http://img.shields.io/badge/license-MIT-orange.svg?style=flat)](https://raw.githubusercontent.com/crazycodeboy/react-native-check-box/master/LICENSE)

A splash screen library for React Native New Architecture.

## Compatibility

- `react-native-splash-screen-newarch@1.x`
- React Native `>= 0.84.0`
- New Architecture (TurboModule / Codegen)

## Installation

```bash
npm i react-native-splash-screen-newarch
```

## Usage

```ts
import SplashScreen from 'react-native-splash-screen-newarch';

SplashScreen.hide();
```

## Android Setup

Call before `super.onCreate` in `MainActivity.kt`:

```kotlin
import android.os.Bundle
import com.facebook.react.ReactActivity
import org.devio.rn.splashscreen.SplashScreen

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreen.show(this, true)
    super.onCreate(savedInstanceState)
  }
}
```

Create `android/app/src/main/res/layout/launch_screen.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#000000">
    <ImageView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:scaleType="centerCrop"
        android:src="@mipmap/launch_screen" />
</RelativeLayout>
```

## iOS Setup

### 1. Configure `LaunchScreen.storyboard`

Use static layout and image assets from `Assets.xcassets`.

### 2. Call in `AppDelegate.swift`

```swift
import react_native_splash_screen
```

Call after React Native startup:

```swift
RNSplashScreen.show()
```

Key snippet (`AppDelegate.swift`, RN 0.84 template):

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import react_native_splash_screen

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  ...

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    ...
    factory.startReactNative(
      withModuleName: "YourAppName",
      in: window,
      launchOptions: launchOptions
    )
    RNSplashScreen.show() // call after React Native startup
    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  ...
}
```


## API

- `show()`
- `hide()`

---

MIT License

# react-native-splash-screen-newarch

[![License MIT](http://img.shields.io/badge/license-MIT-orange.svg?style=flat)](https://raw.githubusercontent.com/crazycodeboy/react-native-check-box/master/LICENSE)

React Native 新架构启动屏库。

> 本库仅支持 **新架构**（TurboModule / Codegen），**不支持旧架构** Bridge 模式。

## 兼容性

- `react-native-splash-screen-newarch@1.x`
- 需启用 New Architecture 的 React Native
- 仅支持 New Architecture（TurboModule / Codegen）

## 安装

```bash
npm i react-native-splash-screen-newarch
```

## 使用

```ts
import SplashScreen from 'react-native-splash-screen-newarch';

SplashScreen.hide();
```

## Android 配置

## 在 `MainActivity.kt` 的 `super.onCreate` 前调用：

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

## 创建 `android/app/src/main/res/layout/launch_screen.xml`：

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


## 可选：透明窗口方案（你当前使用的方式）

如果你希望尽量弱化 Android 12+ 的系统图标阶段，可在 **启动主题**（如 `LaunchTheme`）中加：

```xml
<item name="android:windowIsTranslucent">true</item>
```

## iOS 配置

### 1. 配置 `LaunchScreen.storyboard`

使用静态布局，图片放在 `Assets.xcassets`。

### 2. 在 `AppDelegate.swift` 调用

```swift
import react_native_splash_screen
```

在 React Native 启动后调用：

```swift
RNSplashScreen.show()
```

关键片段（`AppDelegate.swift`，React Native 新架构模板）：

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
      withModuleName: "你的应用名",
      in: window,
      launchOptions: launchOptions
    )
    RNSplashScreen.show() // <--- 确保在 React Native 启动后调用
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

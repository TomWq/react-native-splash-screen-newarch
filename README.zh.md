# react-native-splash-screen-newarch

[![License MIT](http://img.shields.io/badge/license-MIT-orange.svg?style=flat)](https://raw.githubusercontent.com/crazycodeboy/react-native-check-box/master/LICENSE)

React Native 新架构启动屏库。

## 兼容性

- `react-native-splash-screen-newarch@1.x`
- React Native `>= 0.84.0`
- New Architecture（TurboModule / Codegen）

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

在 `MainActivity.kt` 的 `super.onCreate` 前调用：

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

创建 `android/app/src/main/res/layout/launch_screen.xml`：

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

## iOS 配置

在 `AppDelegate.swift` 中：

```swift
import react_native_splash_screen
```

在 React Native 启动后调用：

```swift
RNSplashScreen.show()
```

## API

- `show()`
- `hide()`

---

MIT License

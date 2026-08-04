---
title: Android 配置
description: 在 React Native CLI Android 项目中手动接入启动屏，并配置 dialog 全屏模式或 AndroidX system 快速模式。
---

# Android 配置

本页适用于没有使用 Expo config plugin 的 React Native CLI 项目。Expo 项目请优先使用 [Expo 配置](./expo)。

## Dialog 模式

默认模式在 Activity 启动后创建原生全屏 Dialog，可以显示完整图片、XML layout，并支持隐藏动画。

### 添加原生调用

在 `super.onCreate(savedInstanceState)` 之前调用 `SplashScreen.show(this, true)`：

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

Java 项目使用：

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

第二个参数控制内容是否延伸到刘海屏区域。

### 添加全屏 layout

推荐创建 `android/app/src/main/res/layout/launch_screen.xml`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#F1F5F1">

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:scaleType="centerCrop"
        android:src="@drawable/launch_screen" />
</FrameLayout>
```

把图片放到：

```text
android/app/src/main/res/drawable/launch_screen.png
```

没有 XML layout 时，本包会创建全屏回退视图，并依次从 `drawable`、`mipmap` 查找名为 `launch_screen` 的资源。都不存在时显示黑色背景。

### NinePatch

`.9.png` 应作为 View 背景使用，让系统读取拉伸区域：

```xml
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/launch_screen" />
```

## System 快速模式

System 模式直接保留 AndroidX SplashScreen，直到 JavaScript 调用 `hide()`。它不会 inflate 全屏 layout，也不会创建 Dialog。

### 原生调用

第三个参数传 `true`：

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
  SplashScreen.show(this, true, true)
  super.onCreate(savedInstanceState)
}
```

### 启动主题

Activity 的 launch theme 必须继承 `Theme.SplashScreen` 并配置退出后的 App theme：

```xml
<resources>
  <style name="Theme.App.SplashScreen" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">@color/splash_background</item>
    <item name="windowSplashScreenAnimatedIcon">@drawable/splash_logo</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
    <item name="android:windowSplashScreenBehavior">icon_preferred</item>
  </style>
</resources>
```

在 `AndroidManifest.xml` 的主 Activity 上使用该主题：

```xml
<activity
    android:name=".MainActivity"
    android:theme="@style/Theme.App.SplashScreen"
    android:exported="true">
    <!-- intent-filter -->
</activity>
```

本包已经依赖 `androidx.core:core-splashscreen`。System 模式适合系统受限区域内的 Logo，不适合全屏图片。

## Android 12 及以上

Android 12+ 最早出现的启动阶段始终由系统控制。Dialog 模式只能在 Activity 启动后接管全屏内容，因此系统阶段的背景色应尽量与全屏图片边缘一致，减少视觉跳变。

可以测试透明 starting window：

```xml
<item name="android:windowIsTranslucent">true</item>
```

透明窗口可能影响冷启动、最近任务、后台拉起和主题切换。只有在目标 Android 版本和主要厂商设备上验证后再启用。

## Theme 兼容

本包本身不要求 AppCompat，但宿主 App theme 必须匹配 Activity 基类。AppCompat 支持的 `ReactActivity` 应使用 `Theme.AppCompat.DayNight.NoActionBar` 等 AppCompat 子主题。

## 验证

至少检查以下场景：

1. 杀进程后的冷启动。
2. 最近任务恢复和后台拉起。
3. Android 11 与 Android 12+。
4. 深色模式和系统动画关闭。
5. 刘海屏、横屏以及 App 支持的主要分辨率。

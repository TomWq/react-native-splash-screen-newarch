# react-native-splash-screen-newarch

[![License MIT](http://img.shields.io/badge/license-MIT-orange.svg?style=flat)](./LICENSE)

语言：[English](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/README.md) | [简体中文](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/README.zh.md)

适用于 React Native 和 Expo prebuild 项目的全屏启动屏库。它会在 React Native 启动期间保持原生启动画面可见，并在首屏准备好后将其移除。

## 功能特性

- 通过 React Native codegen 支持 TurboModule，同时为尚未启用新架构的项目提供 Bridge 回退。
- 提供 `none`、`fade`、`scaleFade`、`slideUpFade` 和 `zoomOutFade` 隐藏过渡，并支持配置 easing。
- Android 支持 XML layout，也可以自动回退到原生全屏视图。
- Android 可选 system 快速模式，启动时不 inflate 全屏 layout，也不创建 `Dialog`。
- Android 全屏模式支持刘海屏区域处理。
- iOS 使用原生覆盖层保持 Launch Screen storyboard 可见，直到 JavaScript 调用 `hide()`。
- 提供原生启动屏可见时长指标，便于分析启动性能。
- 内置 Expo config plugin，可自动完成原生接入和启动资源生成。

## 环境要求

| 目标 | 要求 |
| --- | --- |
| 包版本 | `react-native-splash-screen-newarch@2.x` |
| React Native | 0.76 及以上。 |
| Android | 默认 `minSdkVersion` 24。 |
| iOS | 15.1 及以上。 |
| Expo | SDK 52 及以上，仅支持 prebuild 或 development build。Expo Go 无法加载这个原生模块。 |

CI 兼容矩阵会验证最低 React Native 0.76 的旧架构和新架构、最新稳定版 React Native 的新架构、CLI 示例的 iOS 构建，以及 Expo clean prebuild 后的 Android 构建。React Native 0.82 及以上仅提供新架构。

## 快速开始

### 1. 安装

```bash
npm install react-native-splash-screen-newarch
```

React Native CLI 的 iOS 项目添加依赖后，还需要安装 CocoaPods 依赖：

```bash
cd ios
pod install
```

### 2. 选择原生接入方式

| 项目类型 | 接入方式 |
| --- | --- |
| Expo prebuild / development build | 使用 [Expo config plugin](#expo-配置)。 |
| React Native CLI | 根据 App 支持的平台完成 [Android 配置](#android-配置)和 [iOS 配置](#ios-配置)。 |

### 3. 首屏准备好后隐藏启动屏

建议等导航、字体和首屏渲染依赖的数据准备好后，再调用 `hide()`。

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

如果过早隐藏启动屏，App 启动期间可能会短暂显示空白根视图。

## Expo 配置

在 `app.json` 或 `app.config.js` 中加入插件。只配置共用图片和背景色，即可生成默认的双端配置：

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-splash-screen-newarch",
        {
          "image": "./assets/splash.png",
          "backgroundColor": "#000000"
        }
      ]
    ]
  }
}
```

生成原生项目并重新构建 App：

```bash
npx expo prebuild
npx expo run:android
# 或
npx expo run:ios
```

插件会修改 Android `MainActivity`、iOS `AppDelegate` 和双端启动资源。默认的 Android `dialog` 模式会在 `super.onCreate()` 前恢复 Activity theme；`system` 模式则由 AndroidX SplashScreen 完成主题切换。

### 共用选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `image` | `null` | 双端共用的启动图；平台专属配置会覆盖它。 |
| `backgroundColor` | `#000000` | 双端共用的启动背景色；平台专属配置会覆盖它。 |
| `resizeMode` | `contain` | 共用的 iOS 图片显示模式，可选 `contain` 或 `cover`。 |
| `android` | `true` | 设为 `false` 可跳过 Android，也可以传入 Android 配置对象。 |
| `ios` | `true` | 设为 `false` 可跳过 iOS，也可以传入 iOS 配置对象。 |

### Android 插件选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `android.mode` | `dialog` | `dialog` 支持全屏图片和隐藏动画；`system` 只保留 Android 系统启动屏，并跳过 layout inflate 和 `Dialog` 创建。 |
| `android.fullScreen` | `true` | 控制默认 Android `dialog` 模式使用的刘海屏/全屏参数。 |
| `android.createLayout` | `true` | 管理 `launch_screen.xml`、图片资源、Android 12+ 启动资源和 Activity 启动 theme。设为 `false` 时，插件只添加原生 `show()` 调用，不改动 App 自己的 theme 和资源处理。 |
| `android.overwriteLayout` | `false` | 允许插件替换已有的 `launch_screen.xml`。 |
| `android.image` | `null` | Android 专属图片，支持 `.png`、`.9.png`、`.jpg`、`.jpeg`、`.webp` 和 `.xml`。 |
| `android.backgroundColor` | `#000000` | 自动生成 layout 和系统启动阶段使用的背景色。 |
| `android.imageResizeMode` | `centerCrop` | 自动生成 layout 使用的 `ImageView.scaleType`。 |
| `android.imageWidth` | `null` | 可选图片宽度。数字会转成 `dp`；`120dp`、`wrap_content` 等字符串会原样使用。 |
| `android.imageHeight` | `null` | 可选图片高度，尺寸规则与宽度相同。 |
| `android.imageGravity` | `center` | 自动生成 layout 使用的 `ImageView.layout_gravity`。 |
| `android.postSplashScreenTheme` | 当前 Activity theme | 在 `super.onCreate()` 前恢复的主题，同时用于 `postSplashScreenTheme`。 |
| `android.systemImage` | `dialog` 模式为 `false`；`system` 模式为 `true` | 是否把图片用作 Android 系统启动 icon。Android 会限制 icon 尺寸，因此不适合全屏图片。 |
| `android.windowIsTranslucent` | `false` | 让系统 starting window 透明，避免全屏启动图接管前出现纯色画面。开启前需要验证启动和任务栈表现。 |

Android 12 及以上最早的启动阶段始终由系统控制。插件默认使用配置的背景色和透明系统 icon，等 `MainActivity` 启动后再切换到自动生成的全屏 layout。只有当图片适合 Android 受限的系统 icon 区域时，才建议开启 `android.systemImage`。

如果优先追求 Android 启动速度，可以启用 system 模式。它会一直保留系统启动屏直到 `hide()`，不会创建本库的全屏 `Dialog`：

```json
{
  "android": {
    "mode": "system",
    "image": "./assets/splash-logo.png",
    "backgroundColor": "#000000"
  }
}
```

system 模式适合“居中 Logo + 纯色背景”。如果需要全屏启动图、启动后再次调用 `show()`，或者在 Android 上使用自定义隐藏动画，请继续使用默认的 `dialog` 模式。

### iOS 插件选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `ios.image` | `null` | iOS 专属图片，支持 `.png`、`.jpg`、`.jpeg` 和 `.pdf`。 |
| `ios.backgroundColor` | `#000000` | 创建并使用 `SplashScreenBackground` 颜色资源。 |
| `ios.resizeMode` | `contain` | `contain` 对应 `scaleAspectFit`，`cover` 对应 `scaleAspectFill`。 |
| `ios.imageWidth` | `null` | 可选图片宽度，单位为 point。设置宽高可以生成居中 Logo。 |
| `ios.imageHeight` | `null` | 可选图片高度，单位为 point。 |
| `ios.maxWaitTime` | `10` | 原生覆盖层等待 JavaScript 调用 `hide()` 的最长秒数，超时后会自动移除。 |

插件会把 `UILaunchStoryboardName` 设为 `SplashScreen`，创建 storyboard 和 asset catalog 资源，将它们加入 Xcode 工程，并在 `AppDelegate` 中插入 `RNSplashScreen.show()`。

## Android 配置

本节适用于没有使用 Expo config plugin 的 React Native CLI 项目。

### 添加原生启动调用

在 `super.onCreate(savedInstanceState)` 之前调用 `SplashScreen.show(this, true)`。如果启动屏不需要延伸到刘海屏区域，可以把 `true` 改为 `false`。

手动配置的项目如需使用 Android system 快速路径，可把第三个参数设为 `true`：`SplashScreen.show(this, true, true)`。该模式要求 launch theme 继承 AndroidX `Theme.SplashScreen` 并配置 `postSplashScreenTheme`。下面的两参数调用仍使用默认的全屏 `Dialog`。

Kotlin：

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

Java：

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

### 添加启动画面

本库会优先查找 `android/app/src/main/res/layout/launch_screen.xml`：

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

如果使用 `.9.png`，应把 drawable 设为 View 的背景，让 Android 正确处理 NinePatch 拉伸区域：

```xml
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/launch_screen" />
```

如果 XML layout 不存在，本库会创建原生全屏视图，并依次在 `drawable`、`mipmap` 中查找 `launch_screen`。推荐的回退资源路径是：

```text
android/app/src/main/res/drawable/launch_screen.png
```

如果 layout 和图片资源都不存在，回退视图会显示黑色背景，直到执行 `hide()`。

### Android 12 及以上

本库控制的是 Activity 启动后的全屏视图；更早的系统启动阶段仍由 Android 控制。请通过 App 的 launch theme 配置该阶段。如果需要消除本库接管前的纯色画面，可以测试以下 theme 配置：

```xml
<item name="android:windowIsTranslucent">true</item>
```

透明 starting window 可能影响冷启动、最近任务、后台拉起和主题切换，需要在 App 支持的 Android 版本上实际验证。

本库自身不依赖 AppCompat，但 App theme 仍需与 `Activity` 基类匹配。基于 AppCompat 的 `ReactActivity` 应使用 `Theme.AppCompat.DayNight.NoActionBar` 等 AppCompat 子主题。

## iOS 配置

本节适用于没有使用 Expo config plugin 的 React Native CLI 项目。

iOS 启动屏是系统静态 UI，本库按以下流程工作：

1. App 启动时，iOS 渲染 `UILaunchStoryboardName` 指定的 storyboard。
2. React Native 加载期间，`RNSplashScreen.show()` 使用同一个 storyboard 创建原生覆盖层。
3. 首屏准备好后，JavaScript 调用 `SplashScreen.hide()` 移除覆盖层。

### 配置 Launch Screen storyboard

1. 用 Xcode 打开 `ios/YourApp.xcworkspace`。
2. 将启动图加入 `Assets.xcassets`。
3. 新建或打开 `LaunchScreen.storyboard`，设置背景并添加 Image View。
4. 居中 Logo 需要设置居中约束和固定宽高；全屏图需要约束到四边，并使用 `Aspect Fill`。
5. 在 App target 中把 `General` > `App Icons and Launch Screen` > `Launch Screen File` 设为 `LaunchScreen`。如果手动维护 `Info.plist`，则把 `UILaunchStoryboardName` 设为 `LaunchScreen`。
6. 确认 storyboard 和图片资源都属于当前 App target。

iOS 会缓存启动屏资源。如果修改后没有生效，请从模拟器或真机删除 App，清理构建目录后重新安装。

### 添加原生启动调用

Swift `AppDelegate` 需要引入模块，并在 React Native 启动之后、启动方法返回之前调用 `RNSplashScreen.show()`：

```swift
import rnsplashscreen

// 放在 factory.startReactNative(...) 之后
RNSplashScreen.show()
return true
```

Objective-C 或 Objective-C++ `AppDelegate`：

```objc
#import <rnsplashscreen/RNSplashScreen.h>

// 放在 application:didFinishLaunchingWithOptions: 返回之前
[RNSplashScreen show];
return YES;
```

原生覆盖层默认最多等待 JavaScript 10 秒。手动配置项目可以在 `Info.plist` 中把 `RNSplashScreenMaxWaitTime` 设为非负秒数，以修改该限制。

系统 Launch Screen 本身不能执行动画。iOS 的动画作用于根据启动 storyboard 创建的原生覆盖层；开启“减弱动态效果”后会直接移除覆盖层，不再播放动画。

## API

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

type StartupMetrics = {
  showTime: number | null;
  hideRequestedTime: number | null;
  hiddenTime: number | null;
  nativeVisibleDuration: number | null;
  hideDuration: number | null;
};

SplashScreen.show(): void;
SplashScreen.hide(options?: HideOptions): void;
SplashScreen.getStartupMetrics(): Promise<StartupMetrics>;
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `animation` | `none` | 隐藏过渡，可选 `none`、`fade`、`scaleFade`、`slideUpFade` 或 `zoomOutFade`。 |
| `duration` | `none` 为 `0`；动画过渡为 `250` | 过渡时长，单位为毫秒。负数会被规范化为 `0`。 |
| `scale` | `scaleFade` 为 `1.08`；`zoomOutFade` 为 `0.92` | 目标缩放值。`scaleFade` 限制在 `1.0`-`1.3`，`zoomOutFade` 限制在 `0.7`-`1.0`。 |
| `easing` | `easeOut` | 动画节奏，可选 `linear`、`easeIn`、`easeOut` 或 `easeInOut`。 |

示例：

```ts
SplashScreen.hide();
SplashScreen.hide({ animation: 'fade' });
SplashScreen.hide({ animation: 'slideUpFade', easing: 'easeInOut' });
SplashScreen.hide({ animation: 'zoomOutFade', duration: 250, scale: 0.9 });
```

`SplashScreen.show()` 会使用 App 已配置的平台资源再次显示原生启动视图。正常启动流程是在 JavaScript 加载前通过 Android/iOS 原生代码显示启动屏，再由 JavaScript 的 `hide()` 将其移除。

Android 的隐藏动画作用于透明 Dialog window 上的启动内容 View，system 模式则直接退出。iOS 的隐藏动画作用于 Launch Screen storyboard 覆盖层。系统关闭动画或用户启用“减弱动态效果”时，双端都会跳过动画。

### 启动性能指标

`getStartupMetrics()` 返回基于原生单调时钟的毫秒时间戳，以及两个派生时长：

| 字段 | 含义 |
| --- | --- |
| `showTime` | 开始保留原生启动屏。 |
| `hideRequestedTime` | 原生代码收到 `hide()`。 |
| `hiddenTime` | 原生启动屏实际移除。 |
| `nativeVisibleDuration` | 从 `showTime` 到 `hiddenTime` 的时长。 |
| `hideDuration` | 从 `hideRequestedTime` 到 `hiddenTime` 的时长，包含隐藏动画。 |

对应阶段尚未发生时，字段值为 `null`。这些指标只衡量本库保留原生启动屏的阶段，不等同于完整进程启动、React 渲染或可交互时间。绝对时间戳来自平台单调时钟，只适合在当前 App 进程内比较。

## 常见问题

| 问题 | 检查项 |
| --- | --- |
| 原生模块不可用 | 安装后需要重新构建原生 App；不支持 Expo Go。 |
| iOS 找不到 `rnsplashscreen` | 执行 `cd ios && pod install`，然后清理并重新构建 App。 |
| iOS 启动图修改后不生效 | 删除已安装的 App，再清理、构建并重新安装。 |
| Android 启动图没有显示 | 在 `layout`、`drawable` 或 `mipmap` 中使用准确的资源名 `launch_screen`。 |
| Android 报 AppCompat theme 错误 | 确认宿主 App theme 与 `ReactActivity` 基类兼容。 |
| Expo 插件配置没有生效 | 重新执行 `npx expo prebuild`，并重新构建 development client。 |
| 启动时出现空白画面 | 将 `SplashScreen.hide()` 延后到首屏可以渲染之后。 |

## 示例工程

- [React Native CLI 示例](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/example/README.md)
- [Expo prebuild 示例](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/expo-example/README.md)

## 参考资料

- [Apple Human Interface Guidelines: Launching](https://developer.apple.com/design/human-interface-guidelines/launching)
- [Apple Info.plist key: UILaunchStoryboardName](https://developer.apple.com/documentation/bundleresources/information-property-list/uilaunchstoryboardname)

## 致谢

感谢 [crazycodeboy/react-native-splash-screen](https://github.com/crazycodeboy/react-native-splash-screen)，本包的 API 和实现从中获得了启发。

## License

MIT

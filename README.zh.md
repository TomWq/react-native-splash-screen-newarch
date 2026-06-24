# react-native-splash-screen-newarch

[![License MIT](http://img.shields.io/badge/license-MIT-orange.svg?style=flat)](./LICENSE)

语言：[English](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/README.md) | [简体中文](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/README.zh.md)

面向新版 React Native 的全屏启动屏库，基于经典 `react-native-splash-screen` API 升级。

这是一个面向新版 React Native 的全屏启动屏库。它保留熟悉的 `show()` / `hide()` API，支持基于 codegen 的 TurboModule，同时保留非新架构项目可用的 Bridge 兼容层，并内置 Expo config plugin。

## 功能特性

- 适配新版 React Native，不强制要求 `react-native >= 0.84.0`。
- 支持 New Architecture / TurboModule，同时保留 Bridge 兼容层。
- 支持 `hide({ animation })`，可选 `none`、`fade`，以及可调节的 `scaleFade`。
- Android 可使用 `launch_screen.xml`，也可以在没有 XML layout 时自动回退到原生全屏视图。
- Android 全屏模式支持 Android P 及以上的刘海屏区域处理。
- iOS 遵循 Apple 当前的 Launch Screen 模型：在 Xcode 中配置静态启动屏，然后由本库保持显示直到 JS 调用 `hide()`。
- Expo config plugin 可自动修改 Android `MainActivity`、iOS `AppDelegate`，并可选创建 Android 启动 layout。

## 兼容性

- 包版本：`react-native-splash-screen-newarch@2.x`
- React Native peer dependency：`*`
- Android：默认 `minSdkVersion` 24
- iOS：15.1+
- Expo：仅支持 prebuild / development-client 项目。由于依赖原生代码，不支持 Expo Go。

示例工程可以使用较新的 React Native 版本作为验证目标，但发布包本身不会把 peer dependency 锁死到某个具体版本。

## 从 1.x 升级到 2.x

2.x 包含原生命名空间和模块名变更。如果你的 App 已经手动接入过 1.x，需要先更新原生文件里的 import，再重新构建。

### 原生 import 变化

| 位置 | 1.x | 2.x |
| --- | --- | --- |
| Android Kotlin / Java import | `org.devio.rn.splashscreen.SplashScreen` | `com.tomwq.rnsplashscreen.SplashScreen` |
| Android library namespace | `org.devio.rn.splashscreen` | `com.tomwq.rnsplashscreen` |
| iOS Swift import | `import react_native_splash_screen` | `import rnsplashscreen` |
| iOS Objective-C header | `#import <react_native_splash_screen/RNSplashScreen.h>` | `#import <rnsplashscreen/RNSplashScreen.h>` |
| CocoaPods spec 文件 | `react-native-splash-screen.podspec` | `react-native-splash-screen-newarch.podspec` |

JavaScript 包引入方式不变：

```ts
import SplashScreen from 'react-native-splash-screen-newarch';
```

### 2.x 主要变化

- podspec 文件改名为 `react-native-splash-screen-newarch.podspec`，与当前包名保持一致。
- Android 不再暴露旧的 `org.devio.rn.splashscreen` 包路径。
- iOS Swift module 改为 `rnsplashscreen`。
- `hide(options)` 新增 `fade` 和 `scaleFade` 动画。
- Android 不再要求这个库使用 AppCompat 主题。
- Android 在缺少 `launch_screen.xml` 时，可以回退到原生全屏视图。
- Expo 项目可以使用内置 config plugin，不必手动修改原生文件。

升级后建议重新安装 iOS 原生依赖：

```bash
cd ios
pod install
```

如果 Xcode 或 Gradle 仍然解析到旧的原生符号，可以清理 derived data / build 目录后重新构建 App。

## 安装

```bash
npm install react-native-splash-screen-newarch
```

React Native CLI 的 iOS 项目安装后需要执行：

```bash
cd ios
pod install
```

## JavaScript 使用

建议在首屏真正准备好之后再调用 `hide()`。如果过早隐藏启动屏，用户可能会在导航、字体或首屏数据还没完成时看到空白页面。

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

## Expo 配置

在 `app.json` 或 `app.config.js` 中加入 config plugin，然后执行 `npx expo prebuild` 并重新构建 development client。

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-splash-screen-newarch",
        {
          "android": {
            "fullScreen": true,
            "createLayout": true,
            "image": "./assets/splash.png",
            "backgroundColor": "#000000",
            "imageResizeMode": "centerCrop"
          },
          "ios": true
        }
      ]
    ]
  }
}
```

Plugin 选项：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `android` | `true` | 设为 `false` 可跳过 Android 修改；也可以传对象配置 Android。 |
| `ios` | `true` | 设为 `false` 可跳过 iOS `AppDelegate` 修改。 |
| `android.fullScreen` | `true` | 在 `MainActivity` 中调用 `SplashScreen.show(this, true)`。 |
| `android.createLayout` | `true` | 当 Android 缺少 `android/app/src/main/res/layout/launch_screen.xml` 时自动创建。 |
| `android.overwriteLayout` | `false` | 允许插件覆盖已有 Android 启动 layout。 |
| `android.image` | `null` | 将 `.png`、`.jpg`、`.jpeg`、`.webp` 或 `.xml` 文件复制为 `@drawable/launch_screen`。 |
| `android.backgroundColor` | `#000000` | 自动生成 Android 启动 layout 时使用的背景色。 |
| `android.imageResizeMode` | `centerCrop` | 自动生成 layout 中 `ImageView.scaleType` 的取值。 |

iOS 侧，插件只负责插入原生 `RNSplashScreen.show()` 调用。实际启动图仍然需要通过 Xcode 或 Expo 生成的原生 Launch Screen 文件配置。

## Android 配置

如果你不使用 Expo plugin，可以手动添加原生调用。

### Kotlin

在 `super.onCreate(savedInstanceState)` 之前调用 `SplashScreen.show(this, true)`。

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

### Android 启动 Layout

库会优先查找 `android/app/src/main/res/layout/launch_screen.xml`。如果这个 layout 存在，就使用它作为全屏启动内容。

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

### Android 无 XML 回退

如果不存在 `launch_screen.xml`，库会在运行时创建一个轻量的原生 `FrameLayout`。随后会先查找 `drawable` 中名为 `launch_screen` 的资源，再查找 `mipmap`。

推荐的回退资源路径：

```text
android/app/src/main/res/drawable/launch_screen.png
```

如果既没有 layout，也没有图片资源，Android 会显示全屏黑色背景，直到 `hide()` 执行。

### Android 12+ 系统启动屏说明

Android 12 及以上最早的系统启动屏阶段由系统控制。本库会在 `Activity` 创建后接管显示，因此可以在 React Native 启动期间展示全屏 layout 或图片。如果你希望弱化系统启动屏到库内启动屏之间的切换，可以测试透明启动主题：

```xml
<item name="android:windowIsTranslucent">true</item>
```

这个方案需要在目标 Android 版本上测试冷启动、返回栈和主题切换表现后再使用。

本库内部不要求 AppCompat。不过宿主 App 的主题仍然必须匹配你的 `Activity` 基类。如果你的 React Native 模板使用的是基于 AppCompat 的 `ReactActivity`，App 主题需要继续继承 AppCompat，例如 `Theme.AppCompat.DayNight.NoActionBar`；否则 Android 会因为 `You need to use a Theme.AppCompat theme (or descendant) with this activity.` 崩溃。

## iOS 配置

iOS 的启动屏是系统静态 UI。Apple 期望启动屏通过 storyboard 或 launch screen 文件定义，并由 `UILaunchStoryboardName` 指定；系统启动屏内部不会执行自定义代码、网络请求、计时器或运行时动画。

本库与这个模型的关系是：

1. Xcode 先渲染静态的 `LaunchScreen.storyboard`。
2. `RNSplashScreen.show()` 会根据 `UILaunchStoryboardName` 创建一份启动 storyboard overlay window，并在 React Native 加载期间保持它可见。
3. JavaScript 首屏准备好后调用 `SplashScreen.hide()`，这层覆盖视图会按指定动画移除。

### 在 Xcode 中配置启动图

1. 用 Xcode 打开 `ios/YourApp.xcworkspace`。
2. 将启动图放入 `Assets.xcassets`。可以创建 `SplashLogo` 这样的 Logo Image Set，也可以创建 `LaunchScreenBackground` 这样的全屏背景图。
3. 打开 `LaunchScreen.storyboard`。如果项目里没有这个文件，新建一个名为 `LaunchScreen.storyboard` 的 storyboard。
4. 设置根视图背景色，让它与品牌色或 App 首屏背景一致。
5. 添加 `Image View`，用于显示 Logo 或全屏背景图。
6. 如果是居中 Logo，将 Image View 约束到根视图中心，并设置明确的宽高约束。
7. 如果是一整张全屏图，将 Image View 四边约束到根视图边缘，并把 content mode 设置为 `Aspect Fill`。
8. 选中 App target，进入 `General` > `App Icons and Launch Screen`，将 `Launch Screen File` 设置为 `LaunchScreen`。
9. 如果你手动维护 `Info.plist`，确认 `UILaunchStoryboardName` 的值为 `LaunchScreen`。
10. 确认 storyboard 和图片资源都勾选了当前 App target membership。

开发阶段 iOS 可能缓存启动屏资源。如果修改后没有生效，可以从模拟器或真机删除 App，清理构建缓存后重新安装。

iOS 侧的 `fade` 和 `scaleFade` 动画作用在这层由启动 storyboard 复制出来的 overlay window 上。系统 Launch Screen 本身是静态的，不能执行自定义动画。

### Swift AppDelegate

引入模块：

```swift
import rnsplashscreen
```

在 React Native 启动之后、`application(_:didFinishLaunchingWithOptions:)` 返回之前调用 `RNSplashScreen.show()`。

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

在 `application:didFinishLaunchingWithOptions:` 返回 `YES` 之前调用：

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

`duration` 的单位是毫秒。`scale` 只对 `scaleFade` 生效，并会被限制在 `1.0` - `1.3` 之间。

| 调用 | 行为 |
| --- | --- |
| `SplashScreen.hide()` | 立即隐藏。 |
| `SplashScreen.hide({ animation: 'none' })` | 立即隐藏。 |
| `SplashScreen.hide({ animation: 'fade' })` | 使用默认 `400ms` 淡出。 |
| `SplashScreen.hide({ animation: 'scaleFade' })` | 使用默认 `400ms` 淡出，并放大到 `1.08`。 |
| `SplashScreen.hide({ animation: 'scaleFade', duration: 500, scale: 1.12 })` | 使用更明显的缩放淡出过渡。 |

Android 侧隐藏动画会作用在启动屏内容 View 上。Dialog window 本身是透明的，并且没有 dim 蒙层，所以 App 内容会直接出现在正在淡出的启动屏后面，不会先闪出一层黑色 Dialog 背景。

iOS 侧隐藏动画会作用在 `RNSplashScreen.show()` 添加到 App window 上方的启动 storyboard overlay window。

## 常见问题

- iOS 找不到 `rnsplashscreen`：执行 `cd ios && pod install`，然后清理并重新构建 App。
- iOS 启动图修改后不生效：iOS 可能缓存 Launch Screen 资源，可以从模拟器或真机删除 App 后重新安装。
- Android 图片没有显示：确认资源名是 `launch_screen`，并放在 `drawable`、`mipmap`，或在 `layout/launch_screen.xml` 中引用。
- Expo 配置没有生效：重新执行 `npx expo prebuild`，并重新构建原生 App 或 development client。
- 启动屏隐藏过早：把 `SplashScreen.hide()` 移到导航、字体、首屏数据准备完成之后。

## 参考

- [Apple Human Interface Guidelines: Launching](https://developer.apple.com/design/human-interface-guidelines/launching)
- [Apple Info.plist key: UILaunchStoryboardName](https://developer.apple.com/documentation/bundleresources/information-property-list/uilaunchstoryboardname)

## License

MIT

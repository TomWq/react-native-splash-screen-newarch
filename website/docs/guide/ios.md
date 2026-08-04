---
title: iOS 配置
description: 在 React Native CLI iOS 项目中配置 Launch Screen storyboard、原生覆盖层和 RNSplashScreen.show()。
---

# iOS 配置

本页适用于没有使用 Expo config plugin 的 React Native CLI 项目。

## 工作方式

1. iOS 在进程启动时渲染 `UILaunchStoryboardName` 指定的静态 storyboard。
2. React Native 启动后，`RNSplashScreen.show()` 从同一个 storyboard 创建原生覆盖层。
3. 首屏准备完成后，JavaScript 调用 `SplashScreen.hide()` 移除覆盖层。

系统 Launch Screen 本身不能执行动画。所有隐藏动画都发生在 App 已经启动后的原生覆盖层上。

## 安装 Pods

```bash
cd ios
pod install
cd ..
```

之后使用 `.xcworkspace` 打开项目。

## 配置 storyboard

1. 将启动图加入 `Assets.xcassets` 并确认属于当前 App target。
2. 新建或打开 `LaunchScreen.storyboard`。
3. 设置 View 背景色并添加 Image View。
4. 居中 Logo 使用中心约束和固定宽高；全屏图片约束到四边并使用 `Aspect Fill`。
5. 在 target 的 `General` > `App Icons and Launch Screen` 中把 Launch Screen File 设为 `LaunchScreen`。

手动维护 `Info.plist` 时确认：

```xml
<key>UILaunchStoryboardName</key>
<string>LaunchScreen</string>
```

## 添加原生调用

Swift `AppDelegate` 引入模块，并在 React Native 启动之后、启动方法返回之前调用：

```swift
import rnsplashscreen

factory.startReactNative(
  withModuleName: "YourApp",
  in: window,
  launchOptions: launchOptions
)

RNSplashScreen.show()
return true
```

Objective-C 或 Objective-C++：

```objc
#import <rnsplashscreen/RNSplashScreen.h>

// 在 application:didFinishLaunchingWithOptions: 返回之前
[RNSplashScreen show];
return YES;
```

## 最长等待时间

覆盖层默认最多等待 JavaScript 10 秒。需要修改时，在 `Info.plist` 中设置非负秒数：

```xml
<key>RNSplashScreenMaxWaitTime</key>
<real>15</real>
```

这个兜底用于避免 JavaScript 异常时启动屏永远遮挡 UI，不应代替正确的首屏状态管理。

## iOS 缓存

iOS 会缓存系统启动画面。图片或 storyboard 修改后没有生效时：

1. 从模拟器或真机删除已安装的 App。
2. 在 Xcode 中清理构建目录。
3. 重新构建并安装 App。

只刷新 JavaScript 或覆盖安装不一定更新系统缓存。

## 无障碍动画

用户开启“减弱动态效果”时，本包会跳过隐藏动画并直接移除覆盖层。不要依赖启动动画传达必须阅读的信息或关键状态。

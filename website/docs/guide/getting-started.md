---
title: 快速开始
description: 安装 react-native-splash-screen-newarch，选择 Expo 或 React Native CLI 接入方式，并在首屏准备完成后隐藏原生启动屏。
---

# 快速开始

`react-native-splash-screen-newarch` 在 React Native 初始化期间保持原生启动画面可见。你的首屏准备完成后，再由 JavaScript 调用 `hide()` 完成原生画面到 React UI 的交接。

## 环境要求

| 目标 | 要求 |
| --- | --- |
| React Native | 0.76 及以上 |
| Expo | SDK 52 及以上，使用 prebuild 或 development build |
| Android | 默认 `minSdkVersion` 24 |
| iOS | 15.1 及以上 |

::: warning Expo Go 不支持
本包包含 Android 和 iOS 原生代码。Expo 项目必须重新生成并构建 development client。
:::

## 安装

```bash
npm install react-native-splash-screen-newarch
```

React Native CLI 的 iOS 项目还需要安装 CocoaPods 依赖：

```bash
cd ios
pod install
cd ..
```

## 选择接入方式

| 项目 | 下一步 |
| --- | --- |
| Expo prebuild / development build | 使用 [Expo config plugin](./expo) 自动生成双端配置 |
| React Native CLI Android | 完成 [Android 手动配置](./android) |
| React Native CLI iOS | 完成 [iOS 手动配置](./ios) |

## 在首屏准备后隐藏

等待导航、字体和首屏渲染所需的数据准备完成，再调用 `hide()`：

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

`hide()` 过早会暴露尚未渲染的根视图，造成白屏或黑屏闪烁；过晚则会让用户误以为 App 卡住。应以首屏可以稳定绘制为边界，而不是设置固定延时。

## 重新构建原生 App

安装或修改原生启动资源后，仅刷新 Metro 不会生效。请重新构建：

```bash
# Expo
npx expo prebuild
npx expo run:android
# 或 npx expo run:ios

# React Native CLI
npx react-native run-android
# 或 npx react-native run-ios
```

## 接下来

- 需要更快的 Android 启动路径：阅读 [启动性能](./performance)。
- 需要全屏图片或退场效果：阅读 [隐藏动画](./animations)。
- 需要确认完整参数：查看 [API 参考](/api/)。

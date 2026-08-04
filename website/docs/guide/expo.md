---
title: Expo 配置
description: 使用 react-native-splash-screen-newarch config plugin 自动生成 Android 和 iOS 启动资源与原生调用。
---

# Expo 配置

Expo 项目通过 config plugin 生成原生启动资源，并把本包的 `show()` 调用插入 Android `MainActivity` 和 iOS `AppDelegate`。

## 最小配置

在 `app.json` 或 `app.config.js` 中加入：

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-splash-screen-newarch",
        {
          "image": "./assets/splash.png",
          "backgroundColor": "#F1F5F1"
        }
      ]
    ]
  }
}
```

随后生成并构建原生项目：

```bash
npx expo prebuild
npx expo run:android
# 或
npx expo run:ios
```

::: tip 修改配置后的日常流程
通常重新执行 `npx expo prebuild` 即可。只有在需要完全重建原生目录并确认没有手动原生修改时，才使用 `npx expo prebuild --clean`。
:::

## 共用选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `image` | `null` | 双端共用图片；平台专属图片优先 |
| `backgroundColor` | `#000000` | 双端共用背景色 |
| `resizeMode` | `contain` | iOS 共用图片模式，可选 `contain` 或 `cover` |
| `android` | `true` | 设为 `false` 跳过 Android，或传入 Android 配置对象 |
| `ios` | `true` | 设为 `false` 跳过 iOS，或传入 iOS 配置对象 |

## Android system 快速模式

适合居中 Logo 和纯色背景：

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-splash-screen-newarch",
        {
          "android": {
            "mode": "system",
            "image": "./assets/splash-logo.png",
            "backgroundColor": "#F1F5F1"
          },
          "ios": {
            "image": "./assets/splash-logo.png",
            "backgroundColor": "#F1F5F1",
            "imageWidth": 160,
            "imageHeight": 160
          }
        }
      ]
    ]
  }
}
```

`system` 模式不会创建本包的全屏 Dialog，因此 Android 上不会播放自定义隐藏动画，也不能在启动后再次 `show()`。

## Android dialog 模式

默认模式适合全屏图片和自定义退场动画：

```json
{
  "android": {
    "mode": "dialog",
    "image": "./assets/splash-full.png",
    "backgroundColor": "#F1F5F1",
    "imageResizeMode": "centerCrop",
    "fullScreen": true
  }
}
```

### Android 选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `mode` | `dialog` | `dialog` 或 `system` |
| `fullScreen` | `true` | `dialog` 模式是否延伸到刘海屏区域 |
| `createLayout` | `true` | 是否由插件管理 layout、启动主题和资源 |
| `overwriteLayout` | `false` | 是否替换已有的 `launch_screen.xml` |
| `image` | 共用 `image` | 支持 PNG、NinePatch、JPG、WebP 和 XML |
| `backgroundColor` | 共用背景色 | layout 和系统启动阶段背景色 |
| `imageResizeMode` | `centerCrop` | 生成的 `ImageView.scaleType` |
| `imageWidth` / `imageHeight` | `null` | 数字转为 dp，也可传 `120dp`、`wrap_content` |
| `imageGravity` | `center` | 生成的 `ImageView.layout_gravity` |
| `postSplashScreenTheme` | 当前 Activity theme | 启动后恢复的 App theme |
| `systemImage` | system 中为 `true` | 是否把图片作为系统受限尺寸的启动 icon |
| `windowIsTranslucent` | `false` | 让 starting window 透明；需要验证任务栈和后台拉起 |

## iOS 选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `image` | 共用 `image` | 支持 PNG、JPG、JPEG 和 PDF |
| `backgroundColor` | 共用背景色 | 生成 `SplashScreenBackground` 颜色资源 |
| `resizeMode` | `contain` | `contain` 或 `cover` |
| `imageWidth` / `imageHeight` | `null` | point 单位；同时设置可生成居中固定尺寸 Logo |
| `maxWaitTime` | `10` | 等待 JavaScript 调用 `hide()` 的最长秒数 |

## 检查插件是否生效

先检查 Expo 是否能解析插件：

```bash
npx expo config --type introspect
```

再检查生成结果：

- Android `MainActivity` 中存在 `SplashScreen.show(...)`。
- Android manifest 的启动 Activity 使用生成的 splash theme。
- iOS `AppDelegate` 中存在 `RNSplashScreen.show()`。
- iOS target 包含生成的 storyboard 和 asset catalog 资源。

配置改变后必须重新构建 development client。Expo Go 无法加载这个原生模块。

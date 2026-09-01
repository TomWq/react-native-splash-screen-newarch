---
title: 兼容性与模式选型
description: 查看 React Native、Expo、Android 和 iOS 的支持范围，并选择 Android system 或 dialog 启动模式。
---

# 兼容性与模式选型

## 支持范围

| 目标 | 支持范围 | 说明 |
| --- | --- | --- |
| React Native | 0.76+ | 通过 codegen 支持 TurboModule；在仍支持旧架构的版本中保留 Bridge 回退 |
| Expo | SDK 52+ | 仅支持 prebuild、development build 或 EAS Build |
| Android | API 24+ | Android 12+ 的最早启动阶段始终由系统控制 |
| iOS | 15.1+ | 系统 Launch Screen 必须是静态 storyboard |

React Native 0.82 及以上只提供新架构。本包的 JavaScript API 在 TurboModule 和 Bridge 回退路径中保持一致。

## 从 1.x 升级

2.x 修改了 Android 和 iOS 的原生包名。若 Android 出现 `Unresolved reference 'devio'`、`SplashScreen` 或 `SplashScreenReactPackage`，请将旧 import 更新为：

```kotlin
import com.tomwq.rnsplashscreen.SplashScreen
```

如果项目手动注册了 `SplashScreenReactPackage`，也请改为 `com.tomwq.rnsplashscreen.SplashScreenReactPackage`；使用当前 React Native 模板时通常可以直接删除这段手动注册，因为本包会自动链接。更新后清理并重新构建原生 App。

## Android 模式对比

| 能力 | `system` | `dialog`（默认） |
| --- | --- | --- |
| 启动开销 | 最低 | 需要加载 layout 并创建原生 Dialog |
| 图片形态 | 居中 Logo + 纯色背景 | 居中 Logo、全屏图片、NinePatch |
| 自定义隐藏动画 | 不支持，直接退出系统启动屏 | 支持 |
| 启动后再次 `show()` | 不支持 | 支持 |
| Android 12+ 视觉一致性 | 最接近系统规范 | 系统阶段后切换到全屏内容 |

### 选择 `system`

满足以下条件时优先选择：

- 启动速度比全屏视觉表现更重要。
- 启动画面是居中 Logo 和单色背景。
- 不需要在 Android 上播放自定义隐藏动画。
- 不会在正常启动完成后再次调用 `show()`。

### 选择 `dialog`

满足以下任一条件时保留默认模式：

- 启动图需要铺满整个屏幕。
- 使用 `.9.png` 或复杂的 XML layout。
- 需要 `fade`、`slideUpFade`、`zoomOutFade` 等退场动画。
- 业务流程中需要再次显示原生启动视图。

## 图片选型

Android 系统启动图标存在尺寸和遮罩限制，不能把全屏海报直接当作 `windowSplashScreenAnimatedIcon`。全屏图片应使用 `dialog` 模式；`system` 模式应提供带透明留白的 Logo 资源，并在常见屏幕密度和 Android 12+ 设备上检查实际尺寸。

iOS Launch Screen 也不能包含动态内容、WebView 或运行时代码。动画实际作用于 App 启动后由本包创建的原生覆盖层。

## Expo 与 React Native CLI

Expo config plugin 会自动修改 `MainActivity`、`AppDelegate`、主题和资源，适合绝大多数 Expo 项目。React Native CLI 项目则需要手动维护原生文件。不要在同一个生成结果上同时重复插入手动调用和插件调用。

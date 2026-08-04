---
title: 启动性能
description: 使用 Android system 模式减少原生启动工作，并通过 getStartupMetrics 测量本包保持启动屏的时间。
---

# 启动性能

启动速度主要由 App 原生初始化、JavaScript bundle、React 渲染和首屏数据共同决定。本包能优化的是启动画面的保持与退出路径，不能替代完整的性能分析。

## 优先级

### 1. 在正确时机隐藏

不要设置固定的 `setTimeout`。导航、字体和首屏必要数据准备完成后立即调用 `hide()`，减少无意义等待，同时避免暴露空白根视图。

### 2. Android 使用 system 模式

如果设计是居中 Logo 和纯色背景，开启 system 模式：

```json
{
  "android": {
    "mode": "system",
    "image": "./assets/splash-logo.png",
    "backgroundColor": "#F1F5F1"
  }
}
```

它会跳过全屏 layout inflate 和 Dialog 创建。代价是没有 Android 自定义隐藏动画、全屏图片和启动后 `show()`。

### 3. 缩短退场动画

动画默认 250 ms。启动性能敏感的产品可以使用 `fade` 配合 180 到 220 ms，或者直接使用 `none`。动画时间会计入 `hideDuration`。

### 4. 优化资源

- 按目标屏幕选择合理像素尺寸，避免解码远大于屏幕的图片。
- Logo 优先使用透明留白明确的小资源。
- 全屏图片按平台裁切，避免依赖运行时缩放修正构图。
- Android NinePatch 适合可拉伸背景，但要正确设置拉伸区域。

## 启动指标

```ts
const metrics = await SplashScreen.getStartupMetrics();
console.log(metrics);
```

返回值：

| 字段 | 含义 |
| --- | --- |
| `showTime` | 原生开始保持启动画面的时间 |
| `hideRequestedTime` | 原生收到 `hide()` 的时间 |
| `hiddenTime` | 启动画面实际移除的时间 |
| `nativeVisibleDuration` | `showTime` 到 `hiddenTime` |
| `hideDuration` | `hideRequestedTime` 到 `hiddenTime`，包含动画 |

尚未发生的阶段返回 `null`。时间戳来自平台单调时钟，只适合在当前 App 进程内比较。

## 指标边界

`getStartupMetrics()` 只测量本包保持原生启动屏的阶段，不等于：

- 进程冷启动总耗时。
- JavaScript bundle 加载时间。
- React 首次渲染时间。
- 用户可交互时间。

对比优化前后结果时，应使用 Release 构建、冷启动、相同设备和相同首屏数据条件，并采集多次结果。

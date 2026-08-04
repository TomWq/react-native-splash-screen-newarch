---
title: 隐藏动画
description: 配置 fade、scaleFade、slideUpFade、zoomOutFade、持续时间、缩放和 easing。
---

# 隐藏动画

动画作用于本包保持的原生启动内容，而不是操作系统最早显示的 Launch Screen。

## 动画类型

| 动画 | 效果 | 适合场景 |
| --- | --- | --- |
| `none` | 立即移除 | 最快交接、Android system 模式 |
| `fade` | 透明度淡出 | 大多数静态启动画面 |
| `scaleFade` | 放大并淡出 | Logo 向外扩散的效果 |
| `slideUpFade` | 上移并淡出 | 内容从下方接管的页面 |
| `zoomOutFade` | 缩小并淡出 | 让首屏视觉向前进入 |

## 基本用法

```ts
SplashScreen.hide({ animation: 'fade' });

SplashScreen.hide({
  animation: 'slideUpFade',
  duration: 250,
  easing: 'easeInOut',
});

SplashScreen.hide({
  animation: 'zoomOutFade',
  duration: 250,
  scale: 0.92,
  easing: 'easeOut',
});
```

## 参数默认值

| 参数 | 默认值 | 限制 |
| --- | --- | --- |
| `duration` | 动画为 `250` ms；`none` 为 `0` | 负数会规范化为 `0` |
| `scale` | `scaleFade` 为 `1.08` | 限制在 `1.0` 到 `1.3` |
| `scale` | `zoomOutFade` 为 `0.92` | 限制在 `0.7` 到 `1.0` |
| `easing` | `easeOut` | `linear`、`easeIn`、`easeOut`、`easeInOut` |

## 平台差异

- Android `dialog`：动画作用于透明 Dialog window 上的启动内容 View。
- Android `system`：直接退出系统启动屏，不执行本包的自定义动画。
- iOS：动画作用于由 Launch Screen storyboard 创建的原生覆盖层。

## 设计建议

- 保持在 180 到 320 ms，避免启动完成后仍长时间遮挡内容。
- 启动图片和首屏共享背景色，能显著降低交接时的闪烁感。
- 不要用固定延时等待动画；在首屏准备完成时直接调用 `hide()`。
- 用户关闭系统动画或开启 Reduce Motion 时，双端都会跳过动画。

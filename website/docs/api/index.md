---
title: API 参考
description: react-native-splash-screen-newarch 的 show、hide、隐藏动画参数和启动指标类型。
---

# API 参考

```ts
import SplashScreen from 'react-native-splash-screen-newarch';
```

## `SplashScreen.show()`

```ts
SplashScreen.show(): void;
```

使用 App 已配置的平台资源再次显示原生启动视图。正常启动流程由原生代码在 JavaScript 加载前显示启动屏，因此业务代码通常只需要调用 `hide()`。

Android `system` 模式不支持启动完成后再次显示。

## `SplashScreen.hide(options?)`

```ts
SplashScreen.hide(options?: HideOptions): void;
```

移除原生启动视图。省略参数时立即移除，不播放动画。

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
```

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `animation` | `none` | 隐藏动画 |
| `duration` | 动画为 `250`；`none` 为 `0` | 毫秒，负数规范化为 `0` |
| `scale` | `scaleFade: 1.08`；`zoomOutFade: 0.92` | 其他动画忽略该参数 |
| `easing` | `easeOut` | 动画节奏 |

无效动画名称会回退为 `none`。`scaleFade` 的 scale 会限制在 `1.0` 到 `1.3`，`zoomOutFade` 会限制在 `0.7` 到 `1.0`。

## `SplashScreen.getStartupMetrics()`

```ts
SplashScreen.getStartupMetrics(): Promise<StartupMetrics>;
```

```ts
type StartupMetrics = {
  showTime: number | null;
  hideRequestedTime: number | null;
  hiddenTime: number | null;
  nativeVisibleDuration: number | null;
  hideDuration: number | null;
};
```

返回原生单调时钟的毫秒时间戳和派生时长。尚未发生或当前原生实现不提供的字段为 `null`。

这些数据只描述本包的原生启动视图，不代表完整启动耗时或可交互时间。

## 缺少原生模块

开发环境中，如果安装后没有重新构建 App，本包会输出一次明确错误。Web 环境和生产构建不会重复输出该提示；调用会安全返回，指标接口返回全部为 `null` 的对象。

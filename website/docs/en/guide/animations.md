---
title: Hide transitions
description: Configure fade, scaleFade, slideUpFade, zoomOutFade, duration, scale, and easing.
---

# Hide transitions

Transitions run on the native content retained by the package, not the operating system's earliest Launch Screen.

## Transition types

| Transition | Effect | Good fit |
| --- | --- | --- |
| `none` | Remove immediately | Fastest handoff and Android system mode |
| `fade` | Fade opacity | Most static launch artwork |
| `scaleFade` | Scale up and fade | A logo expanding outward |
| `slideUpFade` | Move up and fade | Content entering from below |
| `zoomOutFade` | Scale down and fade | The first screen moving forward |

## Usage

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

## Defaults

| Option | Default | Constraint |
| --- | --- | --- |
| `duration` | `250` ms when animated; `0` for `none` | Negative values become `0` |
| `scale` | `1.08` for `scaleFade` | Clamped to `1.0`-`1.3` |
| `scale` | `0.92` for `zoomOutFade` | Clamped to `0.7`-`1.0` |
| `easing` | `easeOut` | `linear`, `easeIn`, `easeOut`, or `easeInOut` |

## Platform behavior

- Android `dialog`: transitions run on the splash content view over a transparent Dialog window.
- Android `system`: exits the system splash directly and does not run package transitions.
- iOS: transitions run on the native overlay created from the Launch Screen storyboard.

## Design guidance

- Keep exits around 180-320 ms so prepared content is not obscured for too long.
- Match the launch artwork and first-screen background colors to reduce visible flashes.
- Do not use a fixed delay. Call `hide()` as soon as the first screen is ready.
- Both platforms skip transitions when the user or system has disabled motion.

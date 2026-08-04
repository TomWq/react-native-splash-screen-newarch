---
title: Startup performance
description: Reduce Android startup work with system mode and measure native splash retention with getStartupMetrics.
---

# Startup performance

Native initialization, JavaScript bundle loading, React rendering, and first-screen data all affect startup time. This package can optimize the splash retention and exit path; it is not a replacement for full startup profiling.

## Priorities

### 1. Hide at the right time

Avoid a fixed `setTimeout`. Call `hide()` immediately after navigation, fonts, and essential first-screen data are ready. This removes unnecessary waiting without exposing an empty root view.

### 2. Use Android system mode

For a centered logo on a solid background:

```json
{
  "android": {
    "mode": "system",
    "image": "./assets/splash-logo.png",
    "backgroundColor": "#F1F5F1"
  }
}
```

This skips full-screen layout inflation and Dialog creation. The tradeoff is no Android custom transition, full-screen artwork, or post-startup `show()`.

### 3. Shorten the exit

Animated transitions default to 250 ms. Startup-sensitive apps can use a 180-220 ms fade or `none`. Animation time is included in `hideDuration`.

### 4. Optimize artwork

- Avoid decoding images far larger than the target screen.
- Prefer a focused logo asset with intentional transparent padding.
- Crop full-screen artwork for each platform instead of fixing composition at runtime.
- Use NinePatch for stretchable Android backgrounds and define its stretch regions correctly.

## Startup metrics

```ts
const metrics = await SplashScreen.getStartupMetrics();
console.log(metrics);
```

| Field | Meaning |
| --- | --- |
| `showTime` | Native splash retention started |
| `hideRequestedTime` | Native code received `hide()` |
| `hiddenTime` | The splash was actually removed |
| `nativeVisibleDuration` | `showTime` to `hiddenTime` |
| `hideDuration` | `hideRequestedTime` to `hiddenTime`, including animation |

Phases that have not occurred return `null`. Timestamps come from a monotonic platform clock and are only comparable inside the current app process.

## Measurement boundary

`getStartupMetrics()` does not measure total cold start, JavaScript bundle loading, React's first render, or time to interactive. Compare Release builds with cold starts on the same device and first-screen data conditions, and collect multiple runs.

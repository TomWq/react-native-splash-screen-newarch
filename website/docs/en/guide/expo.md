---
title: Expo setup
description: Use the react-native-splash-screen-newarch config plugin to generate Android and iOS launch resources and native startup calls.
---

# Expo setup

The Expo config plugin generates native launch resources and inserts the package's `show()` call into Android `MainActivity` and iOS `AppDelegate`.

## Minimal configuration

Add the plugin to `app.json` or `app.config.js`:

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

Generate and build the native projects:

```bash
npx expo prebuild
npx expo run:android
# or
npx expo run:ios
```

::: tip Day-to-day prebuilds
Running `npx expo prebuild` again is normally enough. Use `--clean` only when you intend to recreate the native directories and have confirmed they contain no manual changes you need to preserve.
:::

## Shared options

| Option | Default | Description |
| --- | --- | --- |
| `image` | `null` | Shared image; platform-specific images take precedence |
| `backgroundColor` | `#000000` | Shared background color |
| `resizeMode` | `contain` | Shared iOS mode: `contain` or `cover` |
| `android` | `true` | Set to `false` to skip Android, or pass Android options |
| `ios` | `true` | Set to `false` to skip iOS, or pass iOS options |

## Android system mode

Use this for a centered logo on a solid color:

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

System mode does not create the package's full-screen Android Dialog, so it cannot play custom Android hide transitions or call `show()` after startup.

## Android dialog mode

The default mode supports full-screen artwork and custom exits:

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

### Android options

| Option | Default | Description |
| --- | --- | --- |
| `mode` | `dialog` | `dialog` or `system` |
| `fullScreen` | `true` | Extend dialog content into display cutout areas |
| `createLayout` | `true` | Manage the layout, launch theme, and resources |
| `overwriteLayout` | `false` | Replace an existing `launch_screen.xml` |
| `image` | Shared `image` | PNG, NinePatch, JPG, WebP, and XML |
| `backgroundColor` | Shared color | Layout and system launch background |
| `imageResizeMode` | `centerCrop` | Generated `ImageView.scaleType` |
| `imageWidth` / `imageHeight` | `null` | Numbers become dp; strings are used as written |
| `imageGravity` | `center` | Generated `ImageView.layout_gravity` |
| `postSplashScreenTheme` | Current activity theme | App theme restored after launch |
| `systemImage` | `true` in system | Use the image in Android's constrained icon area |
| `windowIsTranslucent` | `false` | Make the starting window transparent; test task behavior carefully |

## iOS options

| Option | Default | Description |
| --- | --- | --- |
| `image` | Shared `image` | PNG, JPG, JPEG, and PDF |
| `backgroundColor` | Shared color | Generates the `SplashScreenBackground` color asset |
| `resizeMode` | `contain` | `contain` or `cover` |
| `imageWidth` / `imageHeight` | `null` | Points; set both for a fixed centered logo |
| `maxWaitTime` | `10` | Maximum seconds to wait for JavaScript `hide()` |

## Verify plugin output

First check that Expo resolves the plugin:

```bash
npx expo config --type introspect
```

Then inspect the generated native projects:

- Android `MainActivity` contains `SplashScreen.show(...)`.
- The Android launch activity uses the generated splash theme.
- iOS `AppDelegate` contains `RNSplashScreen.show()`.
- The iOS target includes the generated storyboard and asset catalog entries.

Configuration changes require rebuilding the development client. Expo Go cannot load this native module.

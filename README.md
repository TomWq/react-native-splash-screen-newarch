# react-native-splash-screen-newarch

[![License MIT](http://img.shields.io/badge/license-MIT-orange.svg?style=flat)](./LICENSE)

Language: [English](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/README.md) | [简体中文](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/README.zh.md)

A full-screen splash screen for React Native and Expo prebuild projects. It keeps native launch artwork visible while React Native starts, then removes it when your first screen is ready.

## Highlights

- Supports TurboModule through React Native codegen and includes a bridge fallback for projects that have not enabled the New Architecture.
- Provides `none`, `fade`, `scaleFade`, `slideUpFade`, and `zoomOutFade` hide transitions with configurable easing.
- Uses an Android XML layout or a native full-screen fallback.
- Offers an opt-in Android system mode that avoids inflating the full-screen layout and creating a `Dialog` during startup.
- Handles Android display cutouts in full-screen mode.
- Keeps the iOS launch storyboard visible with a native overlay until JavaScript calls `hide()`.
- Exposes native splash visibility metrics for startup profiling.
- Includes an Expo config plugin for native setup and launch asset generation.

## Requirements

| Target | Requirement |
| --- | --- |
| Package | `react-native-splash-screen-newarch@2.x` |
| React Native | 0.76 or newer. |
| Android | `minSdkVersion` 24 by default. |
| iOS | 15.1 or newer. |
| Expo | SDK 52 or newer, using prebuild or development builds. Expo Go cannot load this native module. |

The CI compatibility matrix covers the minimum React Native 0.76 line with both the Legacy and New Architectures, the latest stable React Native with the New Architecture, the CLI example on iOS, and a clean Expo prebuild plus Android build. React Native 0.82 and newer are New Architecture only.

## Quick Start

### 1. Install the package

```bash
npm install react-native-splash-screen-newarch
```

For a React Native CLI iOS project, install CocoaPods dependencies after adding the package:

```bash
cd ios
pod install
```

### 2. Choose a native setup

| Project type | Setup |
| --- | --- |
| Expo prebuild / development build | Use the [Expo config plugin](#expo-configuration). |
| React Native CLI | Complete the [Android](#android-configuration) and [iOS](#ios-configuration) setup for the platforms your app supports. |

### 3. Hide the splash screen when the app is ready

Call `hide()` after navigation, fonts, and any first-screen data needed for the initial render are ready.

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

Hiding the splash screen before the first screen is ready can expose a blank root view during startup.

## Expo Configuration

Add the plugin to `app.json` or `app.config.js`. A shared image and background color are enough for the default generated setup:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-splash-screen-newarch",
        {
          "image": "./assets/splash.png",
          "backgroundColor": "#000000"
        }
      ]
    ]
  }
}
```

Generate the native projects and rebuild the app:

```bash
npx expo prebuild
npx expo run:android
# or
npx expo run:ios
```

The plugin patches Android `MainActivity`, iOS `AppDelegate`, and the platform launch resources. In the default Android `dialog` mode it restores the activity theme before `super.onCreate()`. In `system` mode, AndroidX SplashScreen performs the theme transition.

### Shared options

| Option | Default | Description |
| --- | --- | --- |
| `image` | `null` | Splash image used by both platforms unless overridden by a platform option. |
| `backgroundColor` | `#000000` | Splash background used by both platforms unless overridden by a platform option. |
| `resizeMode` | `contain` | Shared iOS image mode. Use `contain` or `cover`. |
| `android` | `true` | Set to `false` to skip Android, or pass an object with Android options. |
| `ios` | `true` | Set to `false` to skip iOS, or pass an object with iOS options. |

### Android plugin options

| Option | Default | Description |
| --- | --- | --- |
| `android.mode` | `dialog` | `dialog` supports full-screen artwork and hide animations. `system` keeps only Android's system splash and skips layout inflation and `Dialog` creation. |
| `android.fullScreen` | `true` | Controls the cutout/full-screen flag passed to the default Android `dialog` mode. |
| `android.createLayout` | `true` | Manages `launch_screen.xml`, image resources, Android 12+ splash resources, and the activity splash theme. When `false`, the plugin only adds the native `show()` call and leaves app theme/resource handling unchanged. |
| `android.overwriteLayout` | `false` | Allows the plugin to replace an existing `launch_screen.xml`. |
| `android.image` | `null` | Platform image. Supports `.png`, `.9.png`, `.jpg`, `.jpeg`, `.webp`, and `.xml`. |
| `android.backgroundColor` | `#000000` | Background color for the generated layout and system splash phase. |
| `android.imageResizeMode` | `centerCrop` | `ImageView.scaleType` used by the generated layout. |
| `android.imageWidth` | `null` | Optional image width. A number becomes `dp`; strings such as `120dp` or `wrap_content` are used as written. |
| `android.imageHeight` | `null` | Optional image height, using the same dimension rules as width. |
| `android.imageGravity` | `center` | `ImageView.layout_gravity` used by the generated layout. |
| `android.postSplashScreenTheme` | Current activity theme | Theme restored before `super.onCreate()` and used as `postSplashScreenTheme`. |
| `android.systemImage` | `false` in `dialog`; `true` in `system` | Uses the image as the Android system splash icon. Android constrains this icon, so it is not suitable for full-screen artwork. |
| `android.windowIsTranslucent` | `false` | Makes the system starting window transparent to avoid a solid-color frame before the full-screen splash takes over. Test launch and task behavior before enabling it. |

Android 12 and newer always own the earliest system splash phase. By default, the plugin uses the configured background color with a transparent system icon, then switches to the generated full-screen layout when `MainActivity` starts. Set `android.systemImage` only when the asset is suitable for Android's constrained system icon area.

For the fastest Android path, opt into system mode. It keeps the system splash until `hide()` and does not create the package's full-screen `Dialog`:

```json
{
  "android": {
    "mode": "system",
    "image": "./assets/splash-logo.png",
    "backgroundColor": "#000000"
  }
}
```

System mode is intended for a centered logo and solid background. Use the default `dialog` mode when you need full-screen artwork, `show()` after startup, or a custom hide animation on Android.

### iOS plugin options

| Option | Default | Description |
| --- | --- | --- |
| `ios.image` | `null` | Platform image. Supports `.png`, `.jpg`, `.jpeg`, and `.pdf`. |
| `ios.backgroundColor` | `#000000` | Creates and uses the `SplashScreenBackground` color asset. |
| `ios.resizeMode` | `contain` | Uses `scaleAspectFit` for `contain` and `scaleAspectFill` for `cover`. |
| `ios.imageWidth` | `null` | Optional image width in points. Set width and height for a centered logo. |
| `ios.imageHeight` | `null` | Optional image height in points. |
| `ios.maxWaitTime` | `10` | Maximum seconds the native overlay waits for JavaScript to call `hide()` before it is removed automatically. |

The plugin sets `UILaunchStoryboardName` to `SplashScreen`, creates the storyboard and asset catalog entries, adds them to the Xcode project, and inserts `RNSplashScreen.show()` into `AppDelegate`.

## Android Configuration

Use this section for React Native CLI projects that do not use the Expo config plugin.

### Add the native startup call

Call `SplashScreen.show(this, true)` before `super.onCreate(savedInstanceState)`. Pass `false` instead of `true` if the splash should not extend into display cutout areas.

To use the Android system fast path in a manually configured project, pass `true` as the third argument: `SplashScreen.show(this, true, true)`. This requires an AndroidX `Theme.SplashScreen` launch theme with `postSplashScreenTheme` configured. The two-argument call below keeps the default full-screen `Dialog` behavior.

Kotlin:

```kotlin
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.tomwq.rnsplashscreen.SplashScreen

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreen.show(this, true)
    super.onCreate(savedInstanceState)
  }
}
```

Java:

```java
import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.tomwq.rnsplashscreen.SplashScreen;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    SplashScreen.show(this, true);
    super.onCreate(savedInstanceState);
  }
}
```

### Add the splash content

The library first looks for `android/app/src/main/res/layout/launch_screen.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#000000">

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:scaleType="centerCrop"
        android:src="@drawable/launch_screen" />
</FrameLayout>
```

For a `.9.png`, use the drawable as the view background so Android respects its NinePatch stretch regions:

```xml
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/launch_screen" />
```

If the XML layout is missing, the library creates a native full-screen view and looks for `launch_screen` in `drawable`, then `mipmap`. The recommended fallback path is:

```text
android/app/src/main/res/drawable/launch_screen.png
```

Without a layout or image resource, the fallback displays a black background until `hide()` runs.

### Android 12 and newer

This package controls the full-screen view shown after the activity starts; Android controls the earlier system splash. Configure your app's launch theme for that system phase. To remove a solid-color frame before the library takes over, you can test this theme item:

```xml
<item name="android:windowIsTranslucent">true</item>
```

Translucency can affect cold starts, recents, background launches, and theme transitions, so verify it on the Android versions your app supports.

The library itself does not require AppCompat, but your app theme must still match the `Activity` base class. An AppCompat-backed `ReactActivity` needs an AppCompat descendant such as `Theme.AppCompat.DayNight.NoActionBar`.

## iOS Configuration

Use this section for React Native CLI projects that do not use the Expo config plugin.

iOS launch screens are static system UI. This package follows that model:

1. iOS renders the storyboard named by `UILaunchStoryboardName` while the app starts.
2. `RNSplashScreen.show()` creates an overlay from the same storyboard while React Native loads.
3. JavaScript calls `SplashScreen.hide()` when the first screen is ready.

### Configure the launch storyboard

1. Open `ios/YourApp.xcworkspace` in Xcode.
2. Add the splash image to `Assets.xcassets`.
3. Create or open `LaunchScreen.storyboard`, set its background, and add the image view.
4. For a logo, center the image view and give it fixed width and height constraints. For full-screen artwork, pin it to all four edges and use `Aspect Fill`.
5. In the app target, set `General` > `App Icons and Launch Screen` > `Launch Screen File` to `LaunchScreen`. If you maintain `Info.plist` manually, set `UILaunchStoryboardName` to `LaunchScreen`.
6. Confirm that the storyboard and image assets belong to the app target.

iOS caches launch screen assets. If an update does not appear, delete the app from the simulator or device, clean the build folder, and reinstall it.

### Add the native startup call

For a Swift `AppDelegate`, import the module and call `RNSplashScreen.show()` after React Native starts and before the launch method returns:

```swift
import rnsplashscreen

// After factory.startReactNative(...)
RNSplashScreen.show()
return true
```

For an Objective-C or Objective-C++ `AppDelegate`:

```objc
#import <rnsplashscreen/RNSplashScreen.h>

// Before returning from application:didFinishLaunchingWithOptions:
[RNSplashScreen show];
return YES;
```

The native overlay waits up to 10 seconds for JavaScript by default. To change the limit in a manually configured project, set `RNSplashScreenMaxWaitTime` in `Info.plist` to a non-negative number of seconds.

The system launch screen cannot animate. On iOS, animated transitions run on the native overlay created from the launch storyboard. When Reduce Motion is enabled, the overlay is removed without animation.

## API

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

type StartupMetrics = {
  showTime: number | null;
  hideRequestedTime: number | null;
  hiddenTime: number | null;
  nativeVisibleDuration: number | null;
  hideDuration: number | null;
};

SplashScreen.show(): void;
SplashScreen.hide(options?: HideOptions): void;
SplashScreen.getStartupMetrics(): Promise<StartupMetrics>;
```

| Option | Default | Description |
| --- | --- | --- |
| `animation` | `none` | Hide transition: `none`, `fade`, `scaleFade`, `slideUpFade`, or `zoomOutFade`. |
| `duration` | `0` for `none`; `250` for animated transitions | Duration in milliseconds. Negative values are normalized to `0`. |
| `scale` | `1.08` for `scaleFade`; `0.92` for `zoomOutFade` | Target scale. `scaleFade` is clamped to `1.0`-`1.3`; `zoomOutFade` is clamped to `0.7`-`1.0`. |
| `easing` | `easeOut` | Animation timing: `linear`, `easeIn`, `easeOut`, or `easeInOut`. |

Examples:

```ts
SplashScreen.hide();
SplashScreen.hide({ animation: 'fade' });
SplashScreen.hide({ animation: 'slideUpFade', easing: 'easeInOut' });
SplashScreen.hide({ animation: 'zoomOutFade', duration: 250, scale: 0.9 });
```

`SplashScreen.show()` displays the native splash view again using the platform resources already configured for the app. The normal startup flow uses the native Android/iOS call to show the splash before JavaScript loads, then the JavaScript `hide()` call removes it.

On Android, hide animations run on the splash content view over a transparent dialog window. Android system mode exits immediately instead. On iOS, animations run on the launch storyboard overlay window. Both platforms skip animations when the user or system has disabled motion.

### Startup metrics

`getStartupMetrics()` returns monotonic native timestamps in milliseconds and two derived durations:

| Field | Meaning |
| --- | --- |
| `showTime` | Native splash retention started. |
| `hideRequestedTime` | Native code received `hide()`. |
| `hiddenTime` | The native splash view was actually removed. |
| `nativeVisibleDuration` | Time from `showTime` to `hiddenTime`. |
| `hideDuration` | Time from `hideRequestedTime` to `hiddenTime`, including any hide animation. |

A value is `null` until that phase has occurred. These metrics measure this package's native splash retention, not total process startup, React rendering, or time to interactive. Absolute timestamps are based on each platform's monotonic clock and are only meaningful within the current app process.

## Troubleshooting

| Problem | Check |
| --- | --- |
| Native module is unavailable | Rebuild the native app after installation. Expo Go is not supported. |
| iOS cannot find `rnsplashscreen` | Run `cd ios && pod install`, then clean and rebuild the app. |
| iOS launch image changes do not appear | Delete the installed app, then clean, rebuild, and reinstall it. |
| Android image does not appear | Use the exact resource name `launch_screen` in `layout`, `drawable`, or `mipmap`. |
| Android reports an AppCompat theme error | Make the host app theme compatible with the `ReactActivity` base class. |
| Expo plugin changes do not apply | Run `npx expo prebuild` again and rebuild the development client. |
| A blank view appears during startup | Delay `SplashScreen.hide()` until the first screen is ready to render. |

## Examples

- [React Native CLI example](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/example/README.md)
- [Expo prebuild example](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/expo-example/README.md)

## References

- [Apple Human Interface Guidelines: Launching](https://developer.apple.com/design/human-interface-guidelines/launching)
- [Apple Info.plist key: UILaunchStoryboardName](https://developer.apple.com/documentation/bundleresources/information-property-list/uilaunchstoryboardname)

## Acknowledgements

Thanks to [crazycodeboy/react-native-splash-screen](https://github.com/crazycodeboy/react-native-splash-screen), whose API and implementation inspired this package.

## License

MIT

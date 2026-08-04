# react-native-splash-screen-newarch

[![License MIT](http://img.shields.io/badge/license-MIT-orange.svg?style=flat)](./LICENSE)

Language: [English](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/README.md) | [简体中文](https://github.com/TomWq/react-native-splash-screen-newarch/blob/main/README.zh.md)

A full-screen splash screen for React Native and Expo prebuild projects. It keeps native launch artwork visible while React Native starts, then removes it when your first screen is ready.

## Highlights

- Supports TurboModule through React Native codegen and includes a bridge fallback for projects that have not enabled the New Architecture.
- Provides `none`, `fade`, and configurable `scaleFade` hide transitions.
- Uses an Android XML layout or a native full-screen fallback.
- Handles Android display cutouts in full-screen mode.
- Keeps the iOS launch storyboard visible with a native overlay until JavaScript calls `hide()`.
- Includes an Expo config plugin for native setup and launch asset generation.

## Requirements

| Target | Requirement |
| --- | --- |
| Package | `react-native-splash-screen-newarch@2.x` |
| React Native | No fixed peer version; the example app is the package's current validation target. |
| Android | `minSdkVersion` 24 by default. |
| iOS | 15.1 or newer. |
| Expo | Prebuild or development builds only. Expo Go cannot load this native module. |

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
      animation: 'scaleFade',
      duration: 500,
      scale: 1.12,
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

The plugin patches Android `MainActivity`, iOS `AppDelegate`, and the platform launch resources. On Android it also preserves the activity's existing theme and restores it before `super.onCreate()`.

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
| `android.fullScreen` | `true` | Calls `SplashScreen.show(this, true)` in `MainActivity`. |
| `android.createLayout` | `true` | Creates `launch_screen.xml`, Android 12+ splash resources, and the activity splash theme when they are missing. |
| `android.overwriteLayout` | `false` | Allows the plugin to replace an existing `launch_screen.xml`. |
| `android.image` | `null` | Platform image. Supports `.png`, `.9.png`, `.jpg`, `.jpeg`, `.webp`, and `.xml`. |
| `android.backgroundColor` | `#000000` | Background color for the generated layout and system splash phase. |
| `android.imageResizeMode` | `centerCrop` | `ImageView.scaleType` used by the generated layout. |
| `android.imageWidth` | `null` | Optional image width. A number becomes `dp`; strings such as `120dp` or `wrap_content` are used as written. |
| `android.imageHeight` | `null` | Optional image height, using the same dimension rules as width. |
| `android.imageGravity` | `center` | `ImageView.layout_gravity` used by the generated layout. |
| `android.postSplashScreenTheme` | Current activity theme | Theme restored before `super.onCreate()` and used as `postSplashScreenTheme`. |
| `android.systemImage` | `false` | Uses the image as the Android 12+ system splash icon. Keep it disabled for full-screen artwork because Android constrains system splash icons. |
| `android.windowIsTranslucent` | `false` | Makes the system starting window transparent to avoid a solid-color frame before the full-screen splash takes over. Test launch and task behavior before enabling it. |

Android 12 and newer always own the earliest system splash phase. By default, the plugin uses the configured background color with a transparent system icon, then switches to the generated full-screen layout when `MainActivity` starts. Set `android.systemImage` only when the asset is suitable for Android's constrained system icon area.

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

The system launch screen cannot animate. On iOS, `fade` and `scaleFade` animate the native overlay created from the launch storyboard.

## API

```ts
type HideAnimation = 'none' | 'fade' | 'scaleFade';

type HideOptions = {
  animation?: HideAnimation;
  duration?: number;
  scale?: number;
};

SplashScreen.show(): void;
SplashScreen.hide(options?: HideOptions): void;
```

| Option | Default | Description |
| --- | --- | --- |
| `animation` | `none` | Hide transition. Use `none`, `fade`, or `scaleFade`. |
| `duration` | `0` for `none`; `400` for animated transitions | Duration in milliseconds. Negative values are normalized to `0`. |
| `scale` | `1.08` for `scaleFade` | Target scale for `scaleFade`, clamped from `1.0` to `1.3`. |

Examples:

```ts
SplashScreen.hide();
SplashScreen.hide({ animation: 'fade' });
SplashScreen.hide({ animation: 'scaleFade', duration: 500, scale: 1.12 });
```

`SplashScreen.show()` displays the native splash view again using the platform resources already configured for the app. The normal startup flow uses the native Android/iOS call to show the splash before JavaScript loads, then the JavaScript `hide()` call removes it.

On Android, hide animations run on the splash content view over a transparent dialog window. On iOS, they run on the launch storyboard overlay window.

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

---
title: Android setup
description: Manually integrate the splash screen in a React Native CLI Android app and configure dialog or AndroidX system mode.
---

# Android setup

This page is for React Native CLI projects that do not use the Expo config plugin. Expo projects should use the [Expo setup](./expo).

## Dialog mode

The default mode creates a native full-screen Dialog after the activity starts. It supports complete artwork, custom XML layouts, and hide transitions.

### Add the native call

Call `SplashScreen.show(this, true)` before `super.onCreate(savedInstanceState)`:

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

Java projects use:

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

The second argument controls whether content extends into display cutout areas.

### Add a full-screen layout

Create `android/app/src/main/res/layout/launch_screen.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#F1F5F1">

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:scaleType="centerCrop"
        android:src="@drawable/launch_screen" />
</FrameLayout>
```

Place the image at:

```text
android/app/src/main/res/drawable/launch_screen.png
```

Without an XML layout, the package creates a native full-screen fallback and searches `drawable`, then `mipmap`, for `launch_screen`. It displays a black background if neither exists.

### NinePatch

Use `.9.png` artwork as the view background so Android reads its stretch regions:

```xml
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/launch_screen" />
```

## System mode

System mode retains AndroidX SplashScreen until JavaScript calls `hide()`. It does not inflate a full-screen layout or create a Dialog.

### Native call

Pass `true` as the third argument:

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
  SplashScreen.show(this, true, true)
  super.onCreate(savedInstanceState)
}
```

### Launch theme

The activity launch theme must inherit `Theme.SplashScreen` and name the app theme used after launch:

```xml
<resources>
  <style name="Theme.App.SplashScreen" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">@color/splash_background</item>
    <item name="windowSplashScreenAnimatedIcon">@drawable/splash_logo</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
    <item name="android:windowSplashScreenBehavior">icon_preferred</item>
  </style>
</resources>
```

Apply it to the main activity in `AndroidManifest.xml`:

```xml
<activity
    android:name=".MainActivity"
    android:theme="@style/Theme.App.SplashScreen"
    android:exported="true">
    <!-- intent-filter -->
</activity>
```

The package already depends on `androidx.core:core-splashscreen`. System mode is designed for a logo inside Android's constrained icon area, not full-screen artwork.

## Android 12 and newer

Android always owns the earliest launch phase. Dialog mode takes over only after the activity starts, so match the system splash background to the edges of the full-screen artwork to reduce visual jumps.

You can test a transparent starting window:

```xml
<item name="android:windowIsTranslucent">true</item>
```

Translucency can affect cold starts, recents, background launches, and theme transitions. Verify it across the Android versions and major device vendors you support.

## Theme compatibility

The package does not require AppCompat, but the host theme must match the Activity base class. An AppCompat-backed `ReactActivity` should inherit an AppCompat theme such as `Theme.AppCompat.DayNight.NoActionBar`.

## Validation

Test process-death cold starts, recents and background launches, Android 11 and 12+, dark mode, disabled system animations, display cutouts, orientation, and the screen sizes your app supports.

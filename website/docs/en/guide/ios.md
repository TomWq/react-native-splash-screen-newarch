---
title: iOS setup
description: Configure a Launch Screen storyboard, native overlay, and RNSplashScreen.show() in a React Native CLI iOS project.
---

# iOS setup

This page is for React Native CLI projects that do not use the Expo config plugin.

## How it works

1. iOS renders the static storyboard named by `UILaunchStoryboardName` while the process starts.
2. After React Native starts, `RNSplashScreen.show()` creates a native overlay from the same storyboard.
3. JavaScript calls `SplashScreen.hide()` when the first screen is ready.

The system Launch Screen cannot animate. Hide transitions run on the native overlay after the app has started.

## Install Pods

```bash
cd ios
pod install
cd ..
```

Open the `.xcworkspace` after installation.

## Configure the storyboard

1. Add the launch artwork to `Assets.xcassets` and include it in the app target.
2. Create or open `LaunchScreen.storyboard`.
3. Set the view background and add an Image View.
4. Center a logo with fixed width and height constraints. Pin full-screen artwork to all edges and use `Aspect Fill`.
5. Set the target's `General` > `App Icons and Launch Screen` > `Launch Screen File` to `LaunchScreen`.

When maintaining `Info.plist` manually, verify:

```xml
<key>UILaunchStoryboardName</key>
<string>LaunchScreen</string>
```

## Add the native call

Import the module in a Swift `AppDelegate`, then call it after React Native starts and before the launch method returns:

```swift
import rnsplashscreen

factory.startReactNative(
  withModuleName: "YourApp",
  in: window,
  launchOptions: launchOptions
)

RNSplashScreen.show()
return true
```

Objective-C or Objective-C++ projects use:

```objc
#import <rnsplashscreen/RNSplashScreen.h>

// Before application:didFinishLaunchingWithOptions: returns
[RNSplashScreen show];
return YES;
```

## Maximum wait time

The overlay waits up to 10 seconds for JavaScript by default. Set a non-negative number of seconds in `Info.plist` to change it:

```xml
<key>RNSplashScreenMaxWaitTime</key>
<real>15</real>
```

This protects users from an overlay that never leaves after a JavaScript failure. It should not replace correct first-screen state handling.

## Launch Screen caching

iOS caches system launch artwork. If a storyboard or image update does not appear, delete the installed app, clean the Xcode build folder, then build and install again. JavaScript refreshes and overwrite installs may not clear the system cache.

## Accessible motion

When Reduce Motion is enabled, the package skips the hide transition and removes the overlay directly. Never put required information only in a launch animation.

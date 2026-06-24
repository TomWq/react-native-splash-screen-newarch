# react-native-splash-screen-newarch example

This example app validates the package from the local workspace with:

- React Native 0.84
- New Architecture enabled by the React Native template
- Android fullscreen splash via `SplashScreen.show(this, true)`
- Android `launch_screen.xml` using `@drawable/launch_screen`
- iOS `LaunchScreen.storyboard` with `UILaunchStoryboardName=LaunchScreen`
- JavaScript hide animation using a more visible `scaleFade`

## Run

Install dependencies from the example folder:

```sh
npm install
```

Run Android:

```sh
npm run android
```

Run iOS:

```sh
cd ios
bundle install
bundle exec pod install
cd ..
npm run ios
```

## Important files

- `App.tsx` calls `SplashScreen.hide({ animation: 'scaleFade', duration: 500, scale: 1.12 })`.
- `android/app/src/main/java/com/examples/MainActivity.kt` calls `SplashScreen.show(this, true)` before `super.onCreate`.
- `android/app/src/main/res/layout/launch_screen.xml` defines the Android splash view.
- `ios/examples/AppDelegate.swift` imports `rnsplashscreen` and calls `RNSplashScreen.show()`.
- `ios/examples/LaunchScreen.storyboard` defines the static iOS launch screen.
- On iOS, the hide animation runs on the launch storyboard overlay window created by the library.

## Notes

The app depends on the package through `"react-native-splash-screen-newarch": "file:.."`, so changes in the library can be tested locally.

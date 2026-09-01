---
title: 故障排查
description: 排查 Expo config plugin、原生模块、Android 主题、iOS 启动图缓存、动画和启动白屏问题。
---

# 故障排查

## Android 找不到 `org.devio.rn.splashscreen`

如果错误包含 `Unresolved reference 'devio'`、`SplashScreen` 或 `SplashScreenReactPackage`，通常是 1.x 的 Android import 没有迁移到 2.x。将 `org.devio.rn.splashscreen` 改为 `com.tomwq.rnsplashscreen`。当前 React Native 模板会自动链接本包，通常还应删除手动添加的 `SplashScreenReactPackage`，避免重复注册。修改后清理并重新构建 Android App。

## 原生模块不可用

典型提示：

```text
Native module "SplashScreen" is unavailable
```

检查：

1. 安装依赖后是否重新构建了原生 App。
2. React Native CLI iOS 是否执行了 `pod install`。
3. Expo 是否使用 development build，而不是 Expo Go。
4. Metro 是否连接到了刚构建的新 App，而不是旧安装包。

## Expo 报 config plugin 无效

典型错误：

```text
Package "react-native-splash-screen-newarch" does not contain a valid config plugin.
Unexpected token 'typeof'
```

这通常表示 Expo 没有解析到包根目录的 `app.plugin.js`，随后错误地回退加载 React Native 主入口，并让 Node 解析到 Flow 语法。

检查当前安装版本和插件导出：

```bash
npm ls react-native-splash-screen-newarch
node -e "console.log(typeof require('react-native-splash-screen-newarch/app.plugin'))"
npx expo config --type introspect
```

插件导出应显示 `function`。确认使用当前 2.x 版本、依赖安装完整，并在 `plugins` 中直接写包名，不需要指向 React Native 的 `index.js`。

## Expo 配置没有出现在原生项目

- 修改 `app.json` 后重新执行 `npx expo prebuild`。
- 重新构建 development client；Metro refresh 不会应用原生改动。
- 检查项目是否使用了另一个 `app.config.js` 覆盖当前配置。
- 使用 `npx expo config --type introspect` 查看解析后的配置。

## Android 启动图不显示

- 资源名必须准确为 `launch_screen`。
- 检查 `res/layout/launch_screen.xml`、`res/drawable/launch_screen.*` 或 `res/mipmap/launch_screen.*`。
- XML 中引用的 drawable 必须实际存在。
- `.9.png` 应作为背景，而不是普通 `ImageView.src`。
- 修改资源后重新构建 Android App。

## Android 出现 AppCompat theme 错误

宿主 theme 必须与 `ReactActivity` 的基类兼容。AppCompat Activity 应继承 `Theme.AppCompat.DayNight.NoActionBar` 等 AppCompat theme。System 模式的 launch theme 退出后，`postSplashScreenTheme` 必须指向正确的 App theme。

## Android 12+ 先闪一帧纯色

最早启动阶段由 Android 系统控制。让 `windowSplashScreenBackground` 与实际启动图背景一致。全屏图必须等 Activity 启动后才能由 dialog 模式接管。

`android:windowIsTranslucent=true` 可以测试，但可能影响任务栈与后台拉起，不应未经设备验证直接用于生产。

## iOS 找不到 `rnsplashscreen`

```bash
cd ios
pod install
```

然后用 `.xcworkspace` 打开 Xcode，清理并重新构建。如果仍引用旧缓存，检查 Podfile.lock 和 target 的 Framework 搜索结果。

## iOS 修改启动图后没有变化

iOS 会缓存 Launch Screen。删除设备或模拟器中的 App，清理构建目录，再重新安装。只覆盖安装通常不足以刷新系统缓存。

## 启动屏后出现白屏

`hide()` 调用太早。等导航容器、字体和首屏必要数据准备完成再隐藏。不要用固定延时掩盖首屏状态不明确的问题。

## 动画没有播放

- Android `system` 模式不执行自定义隐藏动画。
- `animation: 'none'` 或 `duration: 0` 会立即移除。
- 用户开启 Reduce Motion 或系统关闭动画时，本包会尊重系统偏好并跳过动画。
- 确认传入的动画名称在 [API](/api/) 支持范围内。

## 启动指标为 `null`

相关阶段可能尚未发生，或者正在运行的原生 App 仍是安装新 API 前的旧构建。重新构建 App，并在 `hide()` 完成后读取指标。

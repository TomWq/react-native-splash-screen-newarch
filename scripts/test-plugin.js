const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');

const originalLoad = Module._load;

Module._load = function load(request, parent, isMain) {
  if (request === 'expo/config-plugins') {
    return {
      createRunOncePlugin: (plugin) => plugin,
      withMainActivity: (config, action) => {
        const modConfig = { ...config, modResults: config._mainActivity };
        const result = action(modConfig);
        return { ...config, _mainActivity: result.modResults };
      },
      withAndroidManifest: (config, action) => {
        const modConfig = {
          ...config,
          modRequest: createModRequest(config, 'android'),
          modResults: config._androidManifest || createAndroidManifestMock(),
        };
        const result = action(modConfig);
        return { ...config, _androidManifest: result.modResults };
      },
      withAppDelegate: (config, action) => {
        const modConfig = { ...config, modResults: config._appDelegate };
        const result = action(modConfig);
        return { ...config, _appDelegate: result.modResults };
      },
      withDangerousMod: (config, [, action]) => {
        const modConfig = {
          ...config,
          modRequest: createModRequest(config),
        };
        action(modConfig);
        return config;
      },
      withInfoPlist: (config, action) => {
        const modConfig = { ...config, modResults: config._infoPlist || {} };
        const result = action(modConfig);
        return { ...config, _infoPlist: result.modResults };
      },
      withXcodeProject: (config, action) => {
        const project = config._xcodeProject || createXcodeProjectMock();
        const modConfig = {
          ...config,
          modResults: project,
          modRequest: createModRequest(config, 'ios'),
        };
        const result = action(modConfig);
        return { ...config, _xcodeProject: result.modResults };
      },
      IOSConfig: {
        XcodeUtils: {
          addResourceFileToGroup({ filepath, project }) {
            project.addedFiles.push(filepath);
          },
        },
      },
      AndroidConfig: {
        Manifest: {
          getMainActivityOrThrow(manifest) {
            return manifest.manifest.application[0].activity[0];
          },
        },
      },
    };
  }

  return originalLoad.apply(this, arguments);
};

const plugin = require('../app.plugin.js');

const POST_SPLASH_SCREEN_THEME_META_DATA =
  'com.tomwq.rnsplashscreen.POST_SPLASH_SCREEN_THEME';

function testDefaultExpoKotlinProject() {
  const root = createTempProject({
    assetName: 'splash.png',
    manifestTheme: '@style/MyCustomTheme',
  });
  const config = runPlugin(
    {
      _projectName: 'example',
      _projectRoot: root,
      _mainActivity: { language: 'kt', contents: kotlinMainActivity },
      _appDelegate: { language: 'swift', contents: swiftAppDelegate },
      _androidManifest: createAndroidManifestMock('@style/MyCustomTheme'),
    },
    {
      image: './assets/splash.png',
      android: { image: './assets/splash.png', windowIsTranslucent: true },
    },
    2
  );

  const main = config._mainActivity.contents;
  const appDelegate = config._appDelegate.contents;
  const styles = read(
    root,
    'android/app/src/main/res/values/styles.xml'
  );
  const colors = read(
    root,
    'android/app/src/main/res/values/colors.xml'
  );
  const systemDrawable = read(
    root,
    'android/app/src/main/res/drawable/launch_screen_system.xml'
  );
  const legacyBackground = read(
    root,
    'android/app/src/main/res/drawable/ic_launcher_background.xml'
  );
  const storyboard = read(root, 'ios/example/SplashScreen.storyboard');
  const imageSetContents = read(
    root,
    'ios/example/Images.xcassets/SplashScreenImage.imageset/Contents.json'
  );
  const colorSetContents = read(
    root,
    'ios/example/Images.xcassets/SplashScreenBackground.colorset/Contents.json'
  );
  const mainActivity = getMainActivity(config._androidManifest);

  check(
    'android import once',
    count(main, 'import com.tomwq.rnsplashscreen.SplashScreen') === 1
  );
  check('android show once', count(main, 'SplashScreen.show(this, true)') === 1);
  check(
    'android apply post theme once',
    count(main, 'SplashScreen.applyPostSplashScreenTheme(this)') === 1
  );
  check('android old setTheme removed', !main.includes('setTheme(R.style.AppTheme)'));
  check('expo android import removed', !main.includes('SplashScreenManager'));
  check('expo android block removed', !main.includes('expo-splashscreen'));
  check(
    'android system splash style',
    styles.includes('windowSplashScreenAnimatedIcon') &&
      styles.includes('@drawable/launch_screen_system') &&
      styles.includes('<item name="postSplashScreenTheme">@style/MyCustomTheme</item>') &&
      styles.includes('android:windowIsTranslucent')
  );
  check(
    'android system splash resources',
    colors.includes('#000000') &&
      colors.includes('<color name="colorPrimary">#123456</color>') &&
      !colors.includes('#ffffff') &&
      systemDrawable.includes('<shape') &&
      !systemDrawable.includes('@drawable/launch_screen')
  );
  check(
    'expo android resources removed',
    !exists(root, 'android/app/src/main/res/drawable-hdpi/splashscreen_logo.png') &&
      !legacyBackground.includes('@drawable/splashscreen_logo') &&
      !legacyBackground.includes('<item>\n  </item>')
  );
  check(
    'android manifest splash theme',
    mainActivity.$['android:theme'] === '@style/Theme.App.SplashScreen'
  );
  check(
    'android post splash theme metadata',
    getMetaDataResource(mainActivity, POST_SPLASH_SCREEN_THEME_META_DATA) ===
      '@style/MyCustomTheme'
  );
  check('swift import once', count(appDelegate, 'import rnsplashscreen') === 1);
  check(
    'expo swift starts before show',
    appDelegate.includes(
      'let splashScreenDidFinishLaunching = super.application(application, didFinishLaunchingWithOptions: launchOptions)\n    RNSplashScreen.show()\n    return splashScreenDidFinishLaunching'
    )
  );
  check(
    'ios plist launch storyboard',
    config._infoPlist.UILaunchStoryboardName === 'SplashScreen'
  );
  check(
    'ios storyboard image',
    storyboard.includes('image="SplashScreenImage"') &&
      storyboard.includes('name="SplashScreenBackground"')
  );
  check(
    'ios image copied',
    exists(
      root,
      'ios/example/Images.xcassets/SplashScreenImage.imageset/SplashScreenImage.png'
    ) && imageSetContents.includes('SplashScreenImage.png')
  );
  check(
    'ios color set',
    colorSetContents.includes('"red": "0.000"') &&
      colorSetContents.includes('"blue": "0.000"')
  );
  check(
    'ios xcode resource',
    config._xcodeProject.addedFiles.includes('example/SplashScreen.storyboard')
  );
}

function testJavaMainActivityWithExplicitThemeAndImageSizing() {
  const root = createTempProject({
    assetName: 'splash.jpg',
    manifestTheme: '@style/ManifestTheme',
  });
  const config = runPlugin({
    _projectName: 'example',
    _projectRoot: root,
    _mainActivity: { language: 'java', contents: javaMainActivity },
    _appDelegate: { language: 'objc', contents: objcAppDelegate },
  }, {
    image: './assets/splash.jpg',
    android: {
      fullScreen: false,
      image: './assets/splash.jpg',
      imageWidth: 160,
      imageHeight: '240dp',
      imageGravity: 'center_horizontal|top',
      imageResizeMode: 'fitCenter',
      postSplashScreenTheme: 'BrandTheme',
      systemImage: true,
    },
  });

  const main = config._mainActivity.contents;
  const layout = read(root, 'android/app/src/main/res/layout/launch_screen.xml');
  const styles = read(root, 'android/app/src/main/res/values/styles.xml');
  const systemDrawable = read(
    root,
    'android/app/src/main/res/drawable/launch_screen_system.xml'
  );
  const objcDelegate = config._appDelegate.contents;
  const mainActivity = getMainActivity(config._androidManifest);

  check(
    'java android import once',
    count(main, 'import com.tomwq.rnsplashscreen.SplashScreen;') === 1
  );
  check('java android show false', main.includes('SplashScreen.show(this, false);'));
  check(
    'java android apply post theme',
    main.includes('SplashScreen.applyPostSplashScreenTheme(this);')
  );
  check(
    'android explicit post splash theme',
    styles.includes('<item name="postSplashScreenTheme">@style/BrandTheme</item>') &&
      getMetaDataResource(mainActivity, POST_SPLASH_SCREEN_THEME_META_DATA) ===
        '@style/BrandTheme'
  );
  check(
    'android sized image layout',
    layout.includes('android:layout_width="160dp"') &&
      layout.includes('android:layout_height="240dp"') &&
      layout.includes('android:layout_gravity="center_horizontal|top"') &&
      layout.includes('android:scaleType="fitCenter"')
  );
  check(
    'android system image can reference launch drawable',
    systemDrawable.includes('@drawable/launch_screen')
  );
  check(
    'objc import once',
    count(objcDelegate, '#import <rnsplashscreen/RNSplashScreen.h>') === 1
  );
  check(
    'objc show before return',
    objcDelegate.includes('[RNSplashScreen show];\n  return YES;')
  );
}

function testExistingAndroidLayoutIsNotOverwritten() {
  const root = createTempProject({
    assetName: 'splash.png',
    existingLayout: '<FrameLayout android:id="@+id/existing" />\n',
  });

  runPlugin({
    _projectName: 'example',
    _projectRoot: root,
    _mainActivity: { language: 'kt', contents: kotlinMainActivity },
    _appDelegate: { language: 'swift', contents: swiftAppDelegate },
  }, {
    image: './assets/splash.png',
    android: { image: './assets/splash.png' },
    ios: false,
  });

  check(
    'existing layout not overwritten',
    read(root, 'android/app/src/main/res/layout/launch_screen.xml') ===
      '<FrameLayout android:id="@+id/existing" />\n'
  );
}

function testAndroidNinePatchImageIsPreserved() {
  const root = createTempProject({ assetName: 'splash.9.png' });

  runPlugin({
    _projectName: 'example',
    _projectRoot: root,
    _mainActivity: { language: 'kt', contents: kotlinMainActivity },
    _appDelegate: { language: 'swift', contents: swiftAppDelegate },
  }, {
    android: { image: './assets/splash.9.png', overwriteLayout: true },
    ios: false,
  });

  const layout = read(root, 'android/app/src/main/res/layout/launch_screen.xml');
  check(
    'android nine patch file copied with .9 suffix',
    exists(root, 'android/app/src/main/res/drawable/launch_screen.9.png')
  );
  check(
    'android nine patch layout uses background resource',
    layout.includes('android:background="@drawable/launch_screen"') &&
      !layout.includes('android:src="@drawable/launch_screen"') &&
      !layout.includes('<ImageView')
  );
}

function testAndroidCreateLayoutFalseOnlyPatchesMainActivity() {
  const root = createTempProject({ assetName: 'splash.png' });
  const config = runPlugin({
    _projectName: 'example',
    _projectRoot: root,
    _mainActivity: { language: 'kt', contents: kotlinMainActivity },
    _appDelegate: { language: 'swift', contents: swiftAppDelegate },
  }, {
    android: { createLayout: false },
    ios: false,
  });

  check(
    'createLayout false patches main activity',
    config._mainActivity.contents.includes('SplashScreen.show(this, true)')
  );
  check('createLayout false skips manifest patch', !config._androidManifest);
  check(
    'createLayout false skips generated resources',
    !exists(root, 'android/app/src/main/res/layout/launch_screen.xml') &&
      !exists(root, 'android/app/src/main/res/drawable/launch_screen_system.xml')
  );
}

function testIosSizingAndMaxWaitTimeOptions() {
  const root = createTempProject({ assetName: 'splash.png' });
  const config = runPlugin({
    _projectName: 'example',
    _projectRoot: root,
    _mainActivity: { language: 'kt', contents: kotlinMainActivity },
    _appDelegate: { language: 'swift', contents: swiftAppDelegate },
  }, {
    android: false,
    ios: {
      image: './assets/splash.png',
      imageWidth: 128,
      imageHeight: 96,
      maxWaitTime: 3.5,
      resizeMode: 'cover',
      backgroundColor: '#0f0',
    },
  });

  const storyboard = read(root, 'ios/example/SplashScreen.storyboard');
  check(
    'ios max wait time plist',
    config._infoPlist.RNSplashScreenMaxWaitTime === 3.5
  );
  check(
    'ios fixed image constraints',
    storyboard.includes('contentMode="scaleAspectFill"') &&
      storyboard.includes('firstAttribute="centerX"') &&
      storyboard.includes('firstAttribute="centerY"') &&
      storyboard.includes('firstAttribute="width" constant="128"') &&
      storyboard.includes('firstAttribute="height" constant="96"') &&
      !storyboard.includes('firstAttribute="leading"')
  );
}

function testInvalidInputs() {
  const root = createTempProject({ assetName: 'splash.gif' });

  assertThrows(
    'invalid android image extension',
    () =>
      runPlugin({
        _projectName: 'example',
        _projectRoot: root,
        _mainActivity: { language: 'kt', contents: kotlinMainActivity },
        _appDelegate: { language: 'swift', contents: swiftAppDelegate },
      }, {
        android: { image: './assets/splash.gif' },
        ios: false,
      }),
    '.9.png'
  );

  assertThrows(
    'invalid ios color',
    () =>
      runPlugin({
        _projectName: 'example',
        _projectRoot: root,
        _mainActivity: { language: 'kt', contents: kotlinMainActivity },
        _appDelegate: { language: 'swift', contents: swiftAppDelegate },
      }, {
        android: false,
        ios: { backgroundColor: 'green' },
      }),
    'hex color'
  );
}

function runPlugin(config, props, times = 1) {
  let next = config;
  for (let index = 0; index < times; index += 1) {
    next = plugin(next, props);
  }
  return next;
}

function createTempProject({
  assetName,
  existingLayout,
  manifestTheme = '@style/AppTheme',
}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rnss-plugin-'));

  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(root, `assets/${assetName}`), 'fakeasset');
  fs.mkdirSync(path.join(root, 'ios/example'), { recursive: true });
  fs.mkdirSync(path.join(root, 'android/app/src/main/res/values'), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, 'android/app/src/main/res/drawable'), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, 'android/app/src/main/res/drawable-hdpi'), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, 'android/app/src/main'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, 'android/app/src/main/AndroidManifest.xml'),
    createAndroidManifestXml(manifestTheme)
  );
  fs.writeFileSync(
    path.join(root, 'android/app/src/main/res/values/colors.xml'),
    [
      '<resources>',
      '  <color name="colorPrimary">#123456</color>',
      '  <color name="splashscreen_background">#ffffff</color>',
      '</resources>',
      '',
    ].join('\n')
  );
  fs.writeFileSync(
    path.join(root, 'android/app/src/main/res/drawable-hdpi/splashscreen_logo.png'),
    'legacy'
  );
  fs.writeFileSync(
    path.join(root, 'android/app/src/main/res/drawable/ic_launcher_background.xml'),
    [
      '<layer-list xmlns:android="http://schemas.android.com/apk/res/android">',
      '  <item android:drawable="@color/splashscreen_background"/>',
      '  <item>',
      '    <bitmap android:gravity="center" android:src="@drawable/splashscreen_logo"/>',
      '  </item>',
      '</layer-list>',
      '',
    ].join('\n')
  );

  if (existingLayout) {
    fs.mkdirSync(path.join(root, 'android/app/src/main/res/layout'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(root, 'android/app/src/main/res/layout/launch_screen.xml'),
      existingLayout
    );
  }

  return root;
}

function createAndroidManifestXml(theme) {
  return [
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android">',
    '  <application android:theme="@style/ApplicationTheme">',
    `    <activity android:name=".MainActivity" android:theme="${theme}" android:exported="true">`,
    '      <intent-filter>',
    '        <action android:name="android.intent.action.MAIN" />',
    '        <category android:name="android.intent.category.LAUNCHER" />',
    '      </intent-filter>',
    '    </activity>',
    '  </application>',
    '</manifest>',
    '',
  ].join('\n');
}

function createModRequest(config, platform) {
  return {
    projectName: config._projectName,
    projectRoot: config._projectRoot,
    platformProjectRoot: path.join(
      config._projectRoot,
      platform === 'android' ? 'android' : 'ios'
    ),
  };
}

function getMainActivity(manifest) {
  return manifest.manifest.application[0].activity[0];
}

function getMetaDataResource(activity, name) {
  return activity['meta-data']?.find((entry) => entry.$?.['android:name'] === name)
    ?.$?.['android:resource'];
}

function read(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function check(name, ok) {
  if (!ok) {
    throw new Error(`Plugin check failed: ${name}`);
  }
}

function assertThrows(name, fn, expectedMessage) {
  try {
    fn();
  } catch (error) {
    check(name, error.message.includes(expectedMessage));
    return;
  }

  throw new Error(`Plugin check failed: ${name}`);
}

function createXcodeProjectMock() {
  return {
    addedFiles: [],
    hasFile() {
      return false;
    },
  };
}

function createAndroidManifestMock(theme = '@style/AppTheme') {
  return {
    manifest: {
      application: [
        {
          activity: [
            {
              $: {
                'android:name': '.MainActivity',
                'android:theme': theme,
              },
            },
          ],
        },
      ],
    },
  };
}

const kotlinMainActivity = `package com.example
import expo.modules.splashscreen.SplashScreenManager

import android.os.Bundle
import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "example"

  override fun onCreate(savedInstanceState: Bundle?) {
    // This is required for expo-splash-screen.
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-demo
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(savedInstanceState)
  }
}
`;

const javaMainActivity = `package com.example;

import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {
}
`;

const swiftAppDelegate = `import UIKit
import Expo

@main
class AppDelegate: ExpoAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;

const objcAppDelegate = `#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  return YES;
}

@end
`;

testDefaultExpoKotlinProject();
testJavaMainActivityWithExplicitThemeAndImageSizing();
testExistingAndroidLayoutIsNotOverwritten();
testAndroidNinePatchImageIsPreserved();
testAndroidCreateLayoutFalseOnlyPatchesMainActivity();
testIosSizingAndMaxWaitTimeOptions();
testInvalidInputs();

console.log('Plugin checks passed');

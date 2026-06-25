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
          modRequest: {
            projectName: config._projectName,
            projectRoot: config._projectRoot,
            platformProjectRoot: path.join(config._projectRoot, 'ios'),
          },
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
          modRequest: {
            projectName: config._projectName,
            projectRoot: config._projectRoot,
            platformProjectRoot: path.join(config._projectRoot, 'ios'),
          },
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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rnss-plugin-'));
fs.mkdirSync(path.join(tmp, 'assets'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'assets/splash.png'), 'fakepng');
fs.mkdirSync(path.join(tmp, 'ios/example'), { recursive: true });
fs.mkdirSync(path.join(tmp, 'android/app/src/main/res/values'), {
  recursive: true,
});
fs.mkdirSync(path.join(tmp, 'android/app/src/main/res/drawable'), {
  recursive: true,
});
fs.mkdirSync(path.join(tmp, 'android/app/src/main/res/drawable-hdpi'), {
  recursive: true,
});
fs.writeFileSync(
  path.join(tmp, 'android/app/src/main/res/values/colors.xml'),
  [
    '<resources>',
    '  <color name="colorPrimary">#123456</color>',
    '  <color name="splashscreen_background">#ffffff</color>',
    '</resources>',
    '',
  ].join('\n')
);
fs.writeFileSync(
  path.join(tmp, 'android/app/src/main/res/drawable-hdpi/splashscreen_logo.png'),
  'legacy'
);
fs.writeFileSync(
  path.join(tmp, 'android/app/src/main/res/drawable/ic_launcher_background.xml'),
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

const objcTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rnss-plugin-objc-'));
fs.mkdirSync(path.join(objcTmp, 'assets'), { recursive: true });
fs.writeFileSync(path.join(objcTmp, 'assets/splash.png'), 'fakepng');
fs.mkdirSync(path.join(objcTmp, 'ios/example'), { recursive: true });

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

let config = {
  _projectName: 'example',
  _projectRoot: tmp,
  _mainActivity: { language: 'kt', contents: kotlinMainActivity },
  _appDelegate: { language: 'swift', contents: swiftAppDelegate },
};

const pluginProps = {
  image: './assets/splash.png',
  android: { image: './assets/splash.png', windowIsTranslucent: true },
};

config = plugin(config, pluginProps);
config = plugin(config, pluginProps);

let objcConfig = {
  _projectName: 'example',
  _projectRoot: objcTmp,
  _mainActivity: { language: 'kt', contents: kotlinMainActivity },
  _appDelegate: { language: 'objc', contents: objcAppDelegate },
};

objcConfig = plugin(objcConfig, {
  image: './assets/splash.png',
  android: false,
});

const main = config._mainActivity.contents;
const appDelegate = config._appDelegate.contents;
const objcDelegate = objcConfig._appDelegate.contents;
const layout = fs.readFileSync(
  path.join(tmp, 'android/app/src/main/res/layout/launch_screen.xml'),
  'utf8'
);
const androidStyles = fs.readFileSync(
  path.join(tmp, 'android/app/src/main/res/values/styles.xml'),
  'utf8'
);
const androidColors = fs.readFileSync(
  path.join(tmp, 'android/app/src/main/res/values/colors.xml'),
  'utf8'
);
const androidSystemDrawable = fs.readFileSync(
  path.join(tmp, 'android/app/src/main/res/drawable/launch_screen_system.xml'),
  'utf8'
);
const androidLegacyBackground = fs.readFileSync(
  path.join(tmp, 'android/app/src/main/res/drawable/ic_launcher_background.xml'),
  'utf8'
);
const storyboard = fs.readFileSync(
  path.join(tmp, 'ios/example/SplashScreen.storyboard'),
  'utf8'
);
const imageSetContents = fs.readFileSync(
  path.join(
    tmp,
    'ios/example/Images.xcassets/SplashScreenImage.imageset/Contents.json'
  ),
  'utf8'
);
const colorSetContents = fs.readFileSync(
  path.join(
    tmp,
    'ios/example/Images.xcassets/SplashScreenBackground.colorset/Contents.json'
  ),
  'utf8'
);

const checks = [
  [
    'android import once',
    count(main, 'import com.tomwq.rnsplashscreen.SplashScreen') === 1,
  ],
  ['android show once', count(main, 'SplashScreen.show(this, true)') === 1],
  ['expo android import removed', !main.includes('SplashScreenManager')],
  ['expo android block removed', !main.includes('expo-splashscreen')],
  [
    'android system splash style',
      androidStyles.includes('windowSplashScreenAnimatedIcon') &&
      androidStyles.includes('@drawable/launch_screen_system') &&
      androidStyles.includes('postSplashScreenTheme') &&
      androidStyles.includes('android:windowIsTranslucent'),
  ],
  [
    'android system splash resources',
    androidColors.includes('#000000') &&
      androidColors.includes('<color name="colorPrimary">#123456</color>') &&
      !androidColors.includes('#ffffff') &&
      androidSystemDrawable.includes('<shape') &&
      !androidSystemDrawable.includes('@drawable/launch_screen'),
  ],
  [
    'expo android resources removed',
    !fs.existsSync(
      path.join(
        tmp,
        'android/app/src/main/res/drawable-hdpi/splashscreen_logo.png'
      )
    ) &&
      !androidLegacyBackground.includes('@drawable/splashscreen_logo') &&
      !androidLegacyBackground.includes('<item>\n  </item>'),
  ],
  [
    'android manifest splash theme',
    config._androidManifest.manifest.application[0].activity[0].$[
      'android:theme'
    ] === '@style/Theme.App.SplashScreen',
  ],
  [
    'android main activity resets theme',
    count(main, 'setTheme(R.style.AppTheme)') === 1,
  ],
  [
    'swift import once',
    count(appDelegate, 'import rnsplashscreen') === 1,
  ],
  [
    'expo swift starts before show',
    appDelegate.includes(
      'let splashScreenDidFinishLaunching = super.application(application, didFinishLaunchingWithOptions: launchOptions)\n    RNSplashScreen.show()\n    return splashScreenDidFinishLaunching'
    ),
  ],
  [
    'objc import once',
    count(
      objcDelegate,
      '#import <rnsplashscreen/RNSplashScreen.h>'
    ) === 1,
  ],
  [
    'objc show before return',
    objcDelegate.includes('[RNSplashScreen show];\n  return YES;'),
  ],
  ['layout image copied', layout.includes('android:src="@drawable/launch_screen"')],
  ['ios plist launch storyboard', config._infoPlist.UILaunchStoryboardName === 'SplashScreen'],
  [
    'ios storyboard image',
    storyboard.includes('image="SplashScreenImage"') &&
      storyboard.includes('name="SplashScreenBackground"'),
  ],
  [
    'ios image copied',
    fs.existsSync(
      path.join(
        tmp,
        'ios/example/Images.xcassets/SplashScreenImage.imageset/SplashScreenImage.png'
      )
    ) && imageSetContents.includes('SplashScreenImage.png'),
  ],
  [
    'ios color set',
    colorSetContents.includes('"red": "0.000"') &&
      colorSetContents.includes('"blue": "0.000"'),
  ],
  [
    'ios xcode resource',
    config._xcodeProject.addedFiles.includes('example/SplashScreen.storyboard'),
  ],
];

for (const [name, ok] of checks) {
  if (!ok) {
    throw new Error(`Plugin check failed: ${name}`);
  }
}

console.log('Plugin checks passed');

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function createXcodeProjectMock() {
  return {
    addedFiles: [],
    hasFile() {
      return false;
    },
  };
}

function createAndroidManifestMock() {
  return {
    manifest: {
      application: [
        {
          activity: [
            {
              $: {
                'android:name': '.MainActivity',
                'android:theme': '@style/AppTheme',
              },
            },
          ],
        },
      ],
    },
  };
}

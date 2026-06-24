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
      withAppDelegate: (config, action) => {
        const modConfig = { ...config, modResults: config._appDelegate };
        const result = action(modConfig);
        return { ...config, _appDelegate: result.modResults };
      },
      withDangerousMod: (config, [, action]) => {
        const modConfig = {
          ...config,
          modRequest: { projectRoot: config._projectRoot },
        };
        action(modConfig);
        return config;
      },
    };
  }

  return originalLoad.apply(this, arguments);
};

const plugin = require('../app.plugin.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rnss-plugin-'));
fs.mkdirSync(path.join(tmp, 'assets'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'assets/splash.png'), 'fakepng');

const kotlinMainActivity = `package com.example

import android.os.Bundle
import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "example"

  override fun onCreate(savedInstanceState: Bundle?) {
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
  _projectRoot: tmp,
  _mainActivity: { language: 'kt', contents: kotlinMainActivity },
  _appDelegate: { language: 'swift', contents: swiftAppDelegate },
};

config = plugin(config, { android: { image: './assets/splash.png' } });
config = plugin(config, { android: { image: './assets/splash.png' } });

let objcConfig = {
  _projectRoot: tmp,
  _mainActivity: { language: 'kt', contents: kotlinMainActivity },
  _appDelegate: { language: 'objc', contents: objcAppDelegate },
};

objcConfig = plugin(objcConfig, { android: false });

const main = config._mainActivity.contents;
const appDelegate = config._appDelegate.contents;
const objcDelegate = objcConfig._appDelegate.contents;
const layout = fs.readFileSync(
  path.join(tmp, 'android/app/src/main/res/layout/launch_screen.xml'),
  'utf8'
);

const checks = [
  [
    'android import once',
    count(main, 'import com.tomwq.rnsplashscreen.SplashScreen') === 1,
  ],
  ['android show once', count(main, 'SplashScreen.show(this, true)') === 1],
  [
    'swift import once',
    count(appDelegate, 'import rnsplashscreen') === 1,
  ],
  [
    'swift show before return',
    appDelegate.includes('RNSplashScreen.show()\n    return super.application'),
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

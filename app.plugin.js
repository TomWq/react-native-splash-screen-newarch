const fs = require('fs');
const path = require('path');

const {
  createRunOncePlugin,
  withAppDelegate,
  withDangerousMod,
  withMainActivity,
} = require('expo/config-plugins');

const pkg = require('./package.json');

const ANDROID_IMPORT = 'import com.tomwq.rnsplashscreen.SplashScreen';
const IOS_SWIFT_IMPORT = 'import rnsplashscreen';
const IOS_OBJC_IMPORT = '#import <rnsplashscreen/RNSplashScreen.h>';

function withReactNativeSplashScreen(config, props = {}) {
  const options = normalizeOptions(props);

  if (options.android) {
    config = withAndroidSplashScreen(config, options);
    if (options.createAndroidLayout) {
      config = withAndroidLaunchScreenLayout(config, options);
    }
  }

  if (options.ios) {
    config = withIosSplashScreen(config);
  }

  return config;
}

function normalizeOptions(props) {
  const androidOptions =
    props.android && typeof props.android === 'object' ? props.android : {};

  return {
    android: props.android !== false,
    ios: props.ios !== false,
    fullScreen: readBoolean(androidOptions.fullScreen, props.fullScreen, true),
    createAndroidLayout: readBoolean(
      androidOptions.createLayout,
      props.createAndroidLayout,
      true
    ),
    overwriteAndroidLayout: readBoolean(
      androidOptions.overwriteLayout,
      props.overwriteAndroidLayout,
      false
    ),
    backgroundColor:
      androidOptions.backgroundColor || props.backgroundColor || '#000000',
    image: androidOptions.image || props.image || null,
    imageResizeMode:
      androidOptions.imageResizeMode || props.imageResizeMode || 'centerCrop',
  };
}

function readBoolean(...values) {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return values[values.length - 1];
}

function withAndroidSplashScreen(config, options) {
  return withMainActivity(config, (config) => {
    const { contents, language } = config.modResults;

    if (language === 'kt' || contents.includes(': ReactActivity()')) {
      config.modResults.contents = patchKotlinMainActivity(
        contents,
        options.fullScreen
      );
    } else if (language === 'java' || contents.includes('extends ReactActivity')) {
      config.modResults.contents = patchJavaMainActivity(
        contents,
        options.fullScreen
      );
    } else {
      throw new Error(
        '[react-native-splash-screen-newarch] Unsupported Android MainActivity language.'
      );
    }

    return config;
  });
}

function patchKotlinMainActivity(contents, fullScreen) {
  let next = addImport(contents, ANDROID_IMPORT);

  if (next.includes('SplashScreen.show(this')) {
    return next;
  }

  const call = `SplashScreen.show(this, ${fullScreen ? 'true' : 'false'})`;
  const beforeSuperOnCreate =
    /(override\s+fun\s+onCreate\s*\([^)]*\)\s*\{[\s\S]*?)(\n[ \t]*)super\.onCreate\s*\(/m;

  if (beforeSuperOnCreate.test(next)) {
    return next.replace(
      beforeSuperOnCreate,
      `$1$2${call}$2super.onCreate(`
    );
  }

  next = addImport(next, 'import android.os.Bundle');

  const onCreate = [
    '',
    '',
    '  override fun onCreate(savedInstanceState: Bundle?) {',
    `    ${call}`,
    '    super.onCreate(savedInstanceState)',
    '  }',
  ].join('\n');

  return replaceOrThrow(
    next,
    /(class\s+\w+\s*:\s*ReactActivity\(\)\s*\{)/,
    `$1${onCreate}`,
    'Could not find the Kotlin MainActivity class declaration.'
  );
}

function patchJavaMainActivity(contents, fullScreen) {
  let next = addImport(contents, `${ANDROID_IMPORT};`);

  if (next.includes('SplashScreen.show(this')) {
    return next;
  }

  const call = `SplashScreen.show(this, ${fullScreen ? 'true' : 'false'});`;
  const beforeSuperOnCreate =
    /((?:protected|public)\s+void\s+onCreate\s*\([^)]*\)\s*\{[\s\S]*?)(\n[ \t]*)super\.onCreate\s*\(/m;

  if (beforeSuperOnCreate.test(next)) {
    return next.replace(
      beforeSuperOnCreate,
      `$1$2${call}$2super.onCreate(`
    );
  }

  next = addImport(next, 'import android.os.Bundle;');

  const onCreate = [
    '',
    '',
    '  @Override',
    '  protected void onCreate(Bundle savedInstanceState) {',
    `    ${call}`,
    '    super.onCreate(savedInstanceState);',
    '  }',
  ].join('\n');

  return replaceOrThrow(
    next,
    /(public\s+class\s+\w+\s+extends\s+ReactActivity\s*\{)/,
    `$1${onCreate}`,
    'Could not find the Java MainActivity class declaration.'
  );
}

function withAndroidLaunchScreenLayout(config, options) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resDir = path.join(projectRoot, 'android/app/src/main/res');
      const layoutDir = path.join(resDir, 'layout');
      const layoutPath = path.join(layoutDir, 'launch_screen.xml');

      if (fs.existsSync(layoutPath) && !options.overwriteAndroidLayout) {
        return config;
      }

      fs.mkdirSync(layoutDir, { recursive: true });
      fs.writeFileSync(
        layoutPath,
        createAndroidLaunchScreenLayout(projectRoot, resDir, options)
      );

      return config;
    },
  ]);
}

function createAndroidLaunchScreenLayout(projectRoot, resDir, options) {
  const background = options.backgroundColor;
  const imageResource = copyAndroidImageResource(projectRoot, resDir, options);

  if (!imageResource) {
    return [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"',
      '    android:layout_width="match_parent"',
      '    android:layout_height="match_parent"',
      `    android:background="${background}" />`,
      '',
    ].join('\n');
  }

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"',
    '    android:layout_width="match_parent"',
    '    android:layout_height="match_parent"',
    `    android:background="${background}">`,
    '    <ImageView',
    '        android:layout_width="match_parent"',
    '        android:layout_height="match_parent"',
    `        android:scaleType="${options.imageResizeMode}"`,
    `        android:src="${imageResource}" />`,
    '</FrameLayout>',
    '',
  ].join('\n');
}

function copyAndroidImageResource(projectRoot, resDir, options) {
  if (!options.image) {
    return null;
  }

  const source = path.resolve(projectRoot, options.image);
  if (!fs.existsSync(source)) {
    throw new Error(
      `[react-native-splash-screen-newarch] Android splash image not found: ${options.image}`
    );
  }

  const extension = path.extname(source).toLowerCase();
  const supportedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.xml']);
  if (!supportedExtensions.has(extension)) {
    throw new Error(
      '[react-native-splash-screen-newarch] Android splash image must be .png, .jpg, .jpeg, .webp, or .xml.'
    );
  }

  const drawableDir = path.join(resDir, 'drawable');
  const destination = path.join(drawableDir, `launch_screen${extension}`);

  fs.mkdirSync(drawableDir, { recursive: true });
  fs.copyFileSync(source, destination);

  return '@drawable/launch_screen';
}

function withIosSplashScreen(config) {
  return withAppDelegate(config, (config) => {
    const { contents, language } = config.modResults;

    if (language === 'swift' || contents.includes('AppDelegate:')) {
      config.modResults.contents = patchSwiftAppDelegate(contents);
    } else if (language === 'objc' || contents.includes('@implementation AppDelegate')) {
      config.modResults.contents = patchObjcAppDelegate(contents);
    } else {
      throw new Error(
        '[react-native-splash-screen-newarch] Unsupported iOS AppDelegate language.'
      );
    }

    return config;
  });
}

function patchSwiftAppDelegate(contents) {
  let next = addImport(contents, IOS_SWIFT_IMPORT);

  if (next.includes('RNSplashScreen.show()')) {
    return next;
  }

  return replaceOrThrow(
    next,
    /(func\s+application\s*\([\s\S]*?didFinishLaunchingWithOptions[\s\S]*?\)\s*->\s*Bool\s*\{[\s\S]*?)(\n[ \t]*)return\b/m,
    '$1$2RNSplashScreen.show()$2return',
    'Could not find the Swift didFinishLaunchingWithOptions return statement.'
  );
}

function patchObjcAppDelegate(contents) {
  let next = addImport(contents, IOS_OBJC_IMPORT);

  if (next.includes('[RNSplashScreen show]')) {
    return next;
  }

  return replaceOrThrow(
    next,
    /(-\s*\(BOOL\)application:[\s\S]*?didFinishLaunchingWithOptions:[\s\S]*?\{[\s\S]*?)(\n[ \t]*)return\b/m,
    '$1$2[RNSplashScreen show];$2return',
    'Could not find the Objective-C didFinishLaunchingWithOptions return statement.'
  );
}

function addImport(contents, importLine) {
  if (contents.includes(importLine)) {
    return contents;
  }

  const imports = [...contents.matchAll(/^import .+$/gm)];
  if (imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const index = lastImport.index + lastImport[0].length;
    return `${contents.slice(0, index)}\n${importLine}${contents.slice(index)}`;
  }

  const objcImports = [...contents.matchAll(/^#import .+$/gm)];
  if (objcImports.length > 0) {
    const lastImport = objcImports[objcImports.length - 1];
    const index = lastImport.index + lastImport[0].length;
    return `${contents.slice(0, index)}\n${importLine}${contents.slice(index)}`;
  }

  const packageMatch = contents.match(/^package [^\n]+\n/);
  if (packageMatch) {
    return `${contents.slice(0, packageMatch[0].length)}\n${importLine}\n${contents.slice(packageMatch[0].length)}`;
  }

  return `${importLine}\n${contents}`;
}

function replaceOrThrow(contents, pattern, replacement, message) {
  if (!pattern.test(contents)) {
    throw new Error(`[react-native-splash-screen-newarch] ${message}`);
  }

  return contents.replace(pattern, replacement);
}

module.exports = createRunOncePlugin(
  withReactNativeSplashScreen,
  pkg.name,
  pkg.version
);

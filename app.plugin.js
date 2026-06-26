const fs = require('fs');
const path = require('path');

const pkg = require('./package.json');

const ANDROID_IMPORT = 'import com.tomwq.rnsplashscreen.SplashScreen';
const EXPO_ANDROID_IMPORT = 'import expo.modules.splashscreen.SplashScreenManager';
const ANDROID_POST_SPLASH_SCREEN_THEME_META_DATA =
  'com.tomwq.rnsplashscreen.POST_SPLASH_SCREEN_THEME';
const IOS_SWIFT_IMPORT = 'import rnsplashscreen';
const IOS_OBJC_IMPORT = '#import <rnsplashscreen/RNSplashScreen.h>';
const IOS_LAUNCH_STORYBOARD = 'SplashScreen';
const IOS_IMAGESET_NAME = 'SplashScreenImage';
const IOS_COLORSET_NAME = 'SplashScreenBackground';
const IOS_MAX_WAIT_TIME_PLIST_KEY = 'RNSplashScreenMaxWaitTime';
let runOncePlugin;

function requireExpoConfigPlugins() {
  const searchPaths = [__dirname, process.cwd()];

  if (require.main?.filename) {
    searchPaths.push(path.dirname(require.main.filename));
  }

  if (module.parent?.filename) {
    searchPaths.push(path.dirname(module.parent.filename));
  }

  for (const basePath of [...new Set(searchPaths)]) {
    let resolvedPath;

    try {
      resolvedPath = require.resolve('expo/config-plugins', {
        paths: [basePath],
      });
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
      }

      continue;
    }

    return require(resolvedPath);
  }

  return require('expo/config-plugins');
}

function withReactNativeSplashScreen(config, props = {}) {
  const options = normalizeOptions(props);

  if (options.android) {
    if (options.createAndroidLayout) {
      config = withAndroidSplashScreenTheme(config, options);
    }
    config = withAndroidSplashScreen(config, options);
    if (options.createAndroidLayout) {
      config = withAndroidLaunchScreenLayout(config, options);
      config = withAndroidSystemSplashScreen(config, options);
    }
  }

  if (options.ios) {
    config = withIosSplashScreen(config, options);
  }

  return config;
}

function normalizeOptions(props) {
  const androidOptions =
    props.android && typeof props.android === 'object' ? props.android : {};
  const iosOptions =
    props.ios && typeof props.ios === 'object' ? props.ios : {};

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
    imageWidth: readAndroidDimension(
      androidOptions.imageWidth,
      props.androidImageWidth,
      null
    ),
    imageHeight: readAndroidDimension(
      androidOptions.imageHeight,
      props.androidImageHeight,
      null
    ),
    imageGravity:
      androidOptions.imageGravity || props.androidImageGravity || 'center',
    androidPostSplashScreenTheme: normalizeAndroidStyleResource(
      androidOptions.postSplashScreenTheme || props.androidPostSplashScreenTheme
    ),
    resolvedAndroidPostSplashScreenTheme: null,
    androidSystemImage: readBoolean(
      androidOptions.systemImage,
      props.androidSystemImage,
      false
    ),
    androidWindowIsTranslucent: readBoolean(
      androidOptions.windowIsTranslucent,
      props.androidWindowIsTranslucent,
      false
    ),
    iosBackgroundColor:
      iosOptions.backgroundColor || props.backgroundColor || '#000000',
    iosImage: iosOptions.image || props.image || null,
    iosResizeMode: iosOptions.resizeMode || props.resizeMode || 'contain',
    iosImageWidth: readPositiveNumber(
      iosOptions.imageWidth,
      props.iosImageWidth,
      null
    ),
    iosImageHeight: readPositiveNumber(
      iosOptions.imageHeight,
      props.iosImageHeight,
      null
    ),
    iosMaxWaitTime: readNonNegativeNumber(
      iosOptions.maxWaitTime,
      props.iosMaxWaitTime,
      null
    ),
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

function readPositiveNumber(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return values[values.length - 1];
}

function readNonNegativeNumber(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value;
    }
  }
  return values[values.length - 1];
}

function readAndroidDimension(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return `${value}dp`;
    }

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return values[values.length - 1];
}

function normalizeAndroidStyleResource(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (
    trimmed.startsWith('@style/') ||
    trimmed.startsWith('@android:style/')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('@')) {
    return trimmed;
  }

  return `@style/${trimmed}`;
}

function withAndroidSplashScreen(config, options) {
  const { withMainActivity } = requireExpoConfigPlugins();

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
  let next = addImport(removeExpoAndroidSplashScreen(contents), ANDROID_IMPORT);
  next = removeAndroidAppThemeReset(next);

  const call = `SplashScreen.show(this, ${fullScreen ? 'true' : 'false'})`;
  const themeCall = 'SplashScreen.applyPostSplashScreenTheme(this)';
  const beforeSuperOnCreate =
    /(override\s+fun\s+onCreate\s*\([^)]*\)\s*\{[\s\S]*?)(\n[ \t]*)super\.onCreate\s*\(/m;

  if (!next.includes('SplashScreen.show(this')) {
    if (beforeSuperOnCreate.test(next)) {
      next = next.replace(
        beforeSuperOnCreate,
        `$1$2${call}$2super.onCreate(`
      );
    } else {
      next = addImport(next, 'import android.os.Bundle');

      const onCreate = [
        '',
        '',
        '  override fun onCreate(savedInstanceState: Bundle?) {',
        `    ${call}`,
        '    super.onCreate(savedInstanceState)',
        '  }',
      ].join('\n');

      next = replaceOrThrow(
        next,
        /(class\s+\w+\s*:\s*ReactActivity\(\)\s*\{)/,
        `$1${onCreate}`,
        'Could not find the Kotlin MainActivity class declaration.'
      );
    }
  }

  return normalizeAndroidSplashPatch(
    replaceOrThrow(
      next,
      beforeSuperOnCreate,
      `$1$2${themeCall}$2super.onCreate(`
    )
  );
}

function patchJavaMainActivity(contents, fullScreen) {
  let next = addImport(
    removeExpoAndroidSplashScreen(contents),
    `${ANDROID_IMPORT};`
  );
  next = removeAndroidAppThemeReset(next);

  const call = `SplashScreen.show(this, ${fullScreen ? 'true' : 'false'});`;
  const themeCall = 'SplashScreen.applyPostSplashScreenTheme(this);';
  const beforeSuperOnCreate =
    /((?:protected|public)\s+void\s+onCreate\s*\([^)]*\)\s*\{[\s\S]*?)(\n[ \t]*)super\.onCreate\s*\(/m;

  if (!next.includes('SplashScreen.show(this')) {
    if (beforeSuperOnCreate.test(next)) {
      next = next.replace(
        beforeSuperOnCreate,
        `$1$2${call}$2super.onCreate(`
      );
    } else {
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

      next = replaceOrThrow(
        next,
        /(public\s+class\s+\w+\s+extends\s+ReactActivity\s*\{)/,
        `$1${onCreate}`,
        'Could not find the Java MainActivity class declaration.'
      );
    }
  }

  return normalizeAndroidSplashPatch(
    replaceOrThrow(
      next,
      beforeSuperOnCreate,
      `$1$2${themeCall}$2super.onCreate(`
    )
  );
}

function removeAndroidAppThemeReset(contents) {
  return contents
    .replace(/\n[ \t]*setTheme\(R\.style\.AppTheme\);?[ \t]*\n/g, '\n')
    .replace(
      /\n[ \t]*SplashScreen\.applyPostSplashScreenTheme\(this\);?[ \t]*\n/g,
      '\n'
    )
    .replace(/\n{3,}/g, '\n\n');
}

function normalizeAndroidSplashPatch(contents) {
  return contents
    .replace(
      /(SplashScreen\.show\(this, (?:true|false)\);?)\n[ \t]*\n([ \t]*SplashScreen\.applyPostSplashScreenTheme\(this\);?)/g,
      '$1\n$2'
    )
    .replace(
      /(SplashScreen\.applyPostSplashScreenTheme\(this\);?)\n[ \t]*\n([ \t]*super\.onCreate\()/g,
      '$1\n$2'
    );
}

function removeExpoAndroidSplashScreen(contents) {
  return contents
    .replace(new RegExp(`^${escapeRegExp(EXPO_ANDROID_IMPORT)};?\\n`, 'm'), '')
    .replace(
      /\n?[ \t]*\/\/ @generated begin expo-splashscreen[\s\S]*?\/\/ @generated end expo-splashscreen\n?/m,
      '\n'
    )
    .replace(/\n?[ \t]*SplashScreenManager\.registerOnActivity\(this\);?\n?/m, '\n')
    .replace(/\n?[ \t]*\/\/ This is required for expo-splash-screen\.\n?/m, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

function withAndroidLaunchScreenLayout(config, options) {
  const { withDangerousMod } = requireExpoConfigPlugins();

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

function withAndroidSystemSplashScreen(config, options) {
  const { withDangerousMod } = requireExpoConfigPlugins();

  return withDangerousMod(config, [
    'android',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resDir = path.join(projectRoot, 'android/app/src/main/res');

      options.resolvedAndroidPostSplashScreenTheme =
        resolveAndroidPostSplashScreenTheme(projectRoot, options);
      writeAndroidSystemSplashResources(resDir, options);

      return config;
    },
  ]);
}

function withAndroidSplashScreenTheme(config, options) {
  const { AndroidConfig, withAndroidManifest } = requireExpoConfigPlugins();

  return withAndroidManifest(config, (config) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(
      config.modResults
    );
    const existingPostSplashScreenTheme = getAndroidActivityMetaDataResource(
      mainActivity,
      ANDROID_POST_SPLASH_SCREEN_THEME_META_DATA
    );
    const currentTheme = mainActivity.$['android:theme'];
    const postSplashScreenTheme =
      options.androidPostSplashScreenTheme ||
      existingPostSplashScreenTheme ||
      (currentTheme && currentTheme !== '@style/Theme.App.SplashScreen'
        ? currentTheme
        : '@style/AppTheme');

    options.resolvedAndroidPostSplashScreenTheme = postSplashScreenTheme;
    upsertAndroidActivityMetaData(mainActivity, {
      'android:name': ANDROID_POST_SPLASH_SCREEN_THEME_META_DATA,
      'android:resource': postSplashScreenTheme,
    });
    mainActivity.$['android:theme'] = '@style/Theme.App.SplashScreen';
    return config;
  });
}

function getAndroidActivityMetaDataResource(activity, name) {
  const metaData = activity['meta-data'];
  if (!Array.isArray(metaData)) {
    return null;
  }

  const item = metaData.find((entry) => entry.$?.['android:name'] === name);
  return item?.$?.['android:resource'] || null;
}

function upsertAndroidActivityMetaData(activity, attributes) {
  const metaData = Array.isArray(activity['meta-data'])
    ? activity['meta-data']
    : [];
  const existing = metaData.find(
    (entry) => entry.$?.['android:name'] === attributes['android:name']
  );

  if (existing) {
    existing.$ = { ...existing.$, ...attributes };
  } else {
    metaData.push({ $: attributes });
  }

  activity['meta-data'] = metaData;
}

function resolveAndroidPostSplashScreenTheme(projectRoot, options) {
  if (options.androidPostSplashScreenTheme) {
    return options.androidPostSplashScreenTheme;
  }

  const manifestPath = path.join(
    projectRoot,
    'android/app/src/main/AndroidManifest.xml'
  );
  const manifest = fs.existsSync(manifestPath)
    ? fs.readFileSync(manifestPath, 'utf8')
    : '';
  const existingMetaDataTheme = readAndroidPostSplashScreenThemeMetaData(
    manifest
  );

  if (existingMetaDataTheme) {
    return existingMetaDataTheme;
  }

  const launchActivityTheme = readAndroidLaunchActivityTheme(manifest);
  if (
    launchActivityTheme &&
    launchActivityTheme !== '@style/Theme.App.SplashScreen'
  ) {
    return launchActivityTheme;
  }

  return readAndroidApplicationTheme(manifest) || '@style/AppTheme';
}

function readAndroidPostSplashScreenThemeMetaData(manifest) {
  const activity = readAndroidLaunchActivity(manifest);
  if (!activity) {
    return null;
  }

  const pattern = new RegExp(
    `<meta-data\\b[^>]*android:name=["']${escapeRegExp(
      ANDROID_POST_SPLASH_SCREEN_THEME_META_DATA
    )}["'][^>]*android:resource=["']([^"']+)["'][^>]*/?>`,
    'm'
  );
  return activity.match(pattern)?.[1] || null;
}

function readAndroidLaunchActivityTheme(manifest) {
  return readAndroidAttribute(readAndroidLaunchActivity(manifest), 'theme');
}

function readAndroidApplicationTheme(manifest) {
  const application = manifest.match(/<application\b[^>]*>/m)?.[0] || '';
  return readAndroidAttribute(application, 'theme');
}

function readAndroidLaunchActivity(manifest) {
  const activities = [
    ...manifest.matchAll(/<activity\b[\s\S]*?<\/activity>/gm),
  ].map((match) => match[0]);

  return (
    activities.find(
      (activity) =>
        activity.includes('android.intent.action.MAIN') &&
        activity.includes('android.intent.category.LAUNCHER')
    ) ||
    activities.find((activity) =>
      /android:name=["'][^"']*MainActivity["']/.test(activity)
    ) ||
    null
  );
}

function readAndroidAttribute(source, attributeName) {
  if (!source) {
    return null;
  }

  const pattern = new RegExp(`android:${attributeName}=["']([^"']+)["']`);
  return source.match(pattern)?.[1] || null;
}

function writeAndroidSystemSplashResources(resDir, options) {
  const valuesDir = path.join(resDir, 'values');
  const drawableDir = path.join(resDir, 'drawable');

  fs.mkdirSync(valuesDir, { recursive: true });
  fs.mkdirSync(drawableDir, { recursive: true });
  removeExpoAndroidSplashResources(resDir);

  const colorsPath = path.join(valuesDir, 'colors.xml');
  const colors = fs.existsSync(colorsPath)
    ? fs.readFileSync(colorsPath, 'utf8')
    : '<resources>\n</resources>\n';
  fs.writeFileSync(
    colorsPath,
    upsertAndroidSplashBackgroundColor(colors, options.backgroundColor)
  );

  fs.writeFileSync(
    path.join(drawableDir, 'launch_screen_system.xml'),
    createAndroidSystemSplashDrawable(
      options.androidSystemImage && Boolean(options.image)
    )
  );

  const stylesPath = path.join(valuesDir, 'styles.xml');
  const styles = fs.existsSync(stylesPath)
    ? fs.readFileSync(stylesPath, 'utf8')
    : '<resources>\n</resources>\n';
  fs.writeFileSync(stylesPath, upsertAndroidSplashStyle(styles, options));
}

function removeExpoAndroidSplashResources(resDir) {
  for (const entry of fs.readdirSync(resDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('drawable')) {
      continue;
    }

    const drawableDir = path.join(resDir, entry.name);
    for (const file of fs.readdirSync(drawableDir)) {
      if (file.startsWith('splashscreen_logo.')) {
        fs.rmSync(path.join(drawableDir, file), { force: true });
      }
    }
  }

  const legacyBackground = path.join(
    resDir,
    'drawable/ic_launcher_background.xml'
  );
  if (!fs.existsSync(legacyBackground)) {
    return;
  }

  const contents = fs.readFileSync(legacyBackground, 'utf8');
  const cleanedContents = cleanAndroidLegacySplashBackground(contents);
  if (cleanedContents !== contents) {
    fs.writeFileSync(legacyBackground, cleanedContents);
  }
}

function cleanAndroidLegacySplashBackground(contents) {
  return contents
    .replace(
      /\n?[ \t]*<item>\s*<bitmap[^>]+@drawable\/splashscreen_logo[^>]*\/>\s*<\/item>\n?/m,
      '\n'
    )
    .replace(
      /\n?[ \t]*<bitmap[^>]+@drawable\/splashscreen_logo[^>]*\/>\n?/m,
      '\n'
    )
    .replace(/\n?[ \t]*<item>\s*<\/item>\n?/m, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

function upsertAndroidSplashBackgroundColor(colors, backgroundColor) {
  const color = `  <color name="splashscreen_background">${backgroundColor}</color>`;
  const existingColor =
    /\n?[ \t]*<color name="splashscreen_background">[\s\S]*?<\/color>\n?/m;

  if (existingColor.test(colors)) {
    return colors.replace(existingColor, `\n${color}\n`);
  }

  if (colors.includes('</resources>')) {
    return colors.replace('</resources>', `${color}\n</resources>`);
  }

  return ['<resources>', color, '</resources>', ''].join('\n');
}

function createAndroidSystemSplashDrawable(hasImage) {
  if (hasImage) {
    return [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<layer-list xmlns:android="http://schemas.android.com/apk/res/android">',
      '  <item',
      '    android:drawable="@drawable/launch_screen"',
      '    android:gravity="center" />',
      '</layer-list>',
      '',
    ].join('\n');
  }

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">',
    '  <size android:width="1dp" android:height="1dp" />',
    '  <solid android:color="@android:color/transparent" />',
    '</shape>',
    '',
  ].join('\n');
}

function upsertAndroidSplashStyle(styles, options) {
  const postSplashScreenTheme =
    options.resolvedAndroidPostSplashScreenTheme ||
    options.androidPostSplashScreenTheme ||
    '@style/AppTheme';
  const splashItems = [
    '    <item name="windowSplashScreenBackground">@color/splashscreen_background</item>',
    '    <item name="windowSplashScreenAnimatedIcon">@drawable/launch_screen_system</item>',
    `    <item name="postSplashScreenTheme">${postSplashScreenTheme}</item>`,
    '    <item name="android:windowSplashScreenBehavior">icon_preferred</item>',
  ];

  if (options.androidWindowIsTranslucent) {
    splashItems.push('    <item name="android:windowIsTranslucent">true</item>');
  }

  const splashStyle = [
    '  <style name="Theme.App.SplashScreen" parent="Theme.SplashScreen">',
    ...splashItems,
    '  </style>',
  ].join('\n');
  const withoutExisting = styles.replace(
    /\n?[ \t]*<style name="Theme\.App\.SplashScreen"[\s\S]*?<\/style>\n?/m,
    '\n'
  );

  if (withoutExisting.includes('</resources>')) {
    return withoutExisting.replace('</resources>', `${splashStyle}\n</resources>`);
  }

  return ['<resources>', splashStyle, '</resources>', ''].join('\n');
}

function createAndroidLaunchScreenLayout(projectRoot, resDir, options) {
  const background = options.backgroundColor;
  const image = copyAndroidImageResource(projectRoot, resDir, options);

  if (!image) {
    return [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"',
      '    android:layout_width="match_parent"',
      '    android:layout_height="match_parent"',
      `    android:background="${background}" />`,
      '',
    ].join('\n');
  }

  if (image.isNinePatch) {
    return [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"',
      '    android:layout_width="match_parent"',
      '    android:layout_height="match_parent"',
      `    android:background="${image.resource}" />`,
      '',
    ].join('\n');
  }

  const hasImageSize = Boolean(options.imageWidth || options.imageHeight);
  const imageWidth = options.imageWidth || (hasImageSize ? 'wrap_content' : 'match_parent');
  const imageHeight = options.imageHeight || (hasImageSize ? 'wrap_content' : 'match_parent');

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"',
    '    android:layout_width="match_parent"',
    '    android:layout_height="match_parent"',
    `    android:background="${background}">`,
    '    <ImageView',
    `        android:layout_width="${imageWidth}"`,
    `        android:layout_height="${imageHeight}"`,
    `        android:layout_gravity="${options.imageGravity}"`,
    `        android:scaleType="${options.imageResizeMode}"`,
    `        android:src="${image.resource}" />`,
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

  const extension = getAndroidDrawableExtension(source);
  const supportedExtensions = new Set([
    '.png',
    '.9.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.xml',
  ]);
  if (!supportedExtensions.has(extension)) {
    throw new Error(
      '[react-native-splash-screen-newarch] Android splash image must be .png, .9.png, .jpg, .jpeg, .webp, or .xml.'
    );
  }

  const drawableDir = path.join(resDir, 'drawable');
  const destination = path.join(drawableDir, `launch_screen${extension}`);

  fs.mkdirSync(drawableDir, { recursive: true });
  fs.copyFileSync(source, destination);

  return {
    resource: '@drawable/launch_screen',
    isNinePatch: extension === '.9.png',
  };
}

function getAndroidDrawableExtension(filePath) {
  const lowerPath = filePath.toLowerCase();
  if (lowerPath.endsWith('.9.png')) {
    return '.9.png';
  }

  return path.extname(lowerPath);
}

function withIosSplashScreen(config, options) {
  const {
    IOSConfig,
    withAppDelegate,
    withDangerousMod,
    withInfoPlist,
    withXcodeProject,
  } = requireExpoConfigPlugins();

  config = withInfoPlist(config, (config) => {
    config.modResults.UILaunchStoryboardName = IOS_LAUNCH_STORYBOARD;
    if (options.iosMaxWaitTime !== null) {
      config.modResults[IOS_MAX_WAIT_TIME_PLIST_KEY] = options.iosMaxWaitTime;
    }
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    (config) => {
      writeIosLaunchScreenFiles(config, options);
      return config;
    },
  ]);

  config = withXcodeProject(config, (config) => {
    const projectName = config.modRequest.projectName;
    const storyboardPath = path.join(
      projectName,
      `${IOS_LAUNCH_STORYBOARD}.storyboard`
    );

    if (!config.modResults.hasFile(storyboardPath)) {
      IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: storyboardPath,
        groupName: projectName,
        project: config.modResults,
      });
    }

    return config;
  });

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

  const expoReturnSuper =
    /(\n[ \t]*)return\s+(super\.application\s*\(\s*application\s*,\s*didFinishLaunchingWithOptions:\s*launchOptions\s*\))/m;

  if (expoReturnSuper.test(next)) {
    return next.replace(
      expoReturnSuper,
      '$1let splashScreenDidFinishLaunching = $2$1RNSplashScreen.show()$1return splashScreenDidFinishLaunching'
    );
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

function writeIosLaunchScreenFiles(config, options) {
  const projectRoot = config.modRequest.projectRoot;
  const projectName = config.modRequest.projectName;
  const iosProjectRoot = config.modRequest.platformProjectRoot;
  const appRoot = path.join(iosProjectRoot, projectName);
  const assetsRoot = path.join(appRoot, 'Images.xcassets');

  fs.mkdirSync(assetsRoot, { recursive: true });
  writeIosAssetCatalogContents(assetsRoot);
  writeIosColorSet(assetsRoot, options.iosBackgroundColor);

  const imageName = copyIosImageAsset(projectRoot, assetsRoot, options);
  fs.writeFileSync(
    path.join(appRoot, `${IOS_LAUNCH_STORYBOARD}.storyboard`),
    createIosLaunchStoryboard({
      backgroundColorName: IOS_COLORSET_NAME,
      backgroundColor: options.iosBackgroundColor,
      imageName,
      resizeMode: options.iosResizeMode,
      imageWidth: options.iosImageWidth,
      imageHeight: options.iosImageHeight,
    })
  );
}

function writeIosAssetCatalogContents(assetsRoot) {
  const contentsPath = path.join(assetsRoot, 'Contents.json');
  if (fs.existsSync(contentsPath)) {
    return;
  }

  fs.writeFileSync(
    contentsPath,
    JSON.stringify({ info: { version: 1, author: 'xcode' } }, null, 2)
  );
}

function writeIosColorSet(assetsRoot, backgroundColor) {
  const colorSetDir = path.join(assetsRoot, `${IOS_COLORSET_NAME}.colorset`);
  fs.mkdirSync(colorSetDir, { recursive: true });

  const color = hexToRgb(backgroundColor);
  fs.writeFileSync(
    path.join(colorSetDir, 'Contents.json'),
    JSON.stringify(
      {
        colors: [
          {
            idiom: 'universal',
            color: {
              'color-space': 'srgb',
              components: {
                red: color.red,
                green: color.green,
                blue: color.blue,
                alpha: '1.000',
              },
            },
          },
        ],
        info: { version: 1, author: 'xcode' },
      },
      null,
      2
    )
  );
}

function copyIosImageAsset(projectRoot, assetsRoot, options) {
  if (!options.iosImage) {
    return null;
  }

  const source = path.resolve(projectRoot, options.iosImage);
  if (!fs.existsSync(source)) {
    throw new Error(
      `[react-native-splash-screen-newarch] iOS splash image not found: ${options.iosImage}`
    );
  }

  const extension = path.extname(source).toLowerCase();
  const supportedExtensions = new Set(['.png', '.jpg', '.jpeg', '.pdf']);
  if (!supportedExtensions.has(extension)) {
    throw new Error(
      '[react-native-splash-screen-newarch] iOS splash image must be .png, .jpg, .jpeg, or .pdf.'
    );
  }

  const imageSetDir = path.join(assetsRoot, `${IOS_IMAGESET_NAME}.imageset`);
  const filename = `${IOS_IMAGESET_NAME}${extension}`;

  fs.rmSync(imageSetDir, { force: true, recursive: true });
  fs.mkdirSync(imageSetDir, { recursive: true });
  fs.copyFileSync(source, path.join(imageSetDir, filename));
  fs.writeFileSync(
    path.join(imageSetDir, 'Contents.json'),
    JSON.stringify(
      {
        images: [
          {
            idiom: 'universal',
            filename,
            scale: '1x',
          },
        ],
        info: { version: 1, author: 'xcode' },
      },
      null,
      2
    )
  );

  return IOS_IMAGESET_NAME;
}

function createIosLaunchStoryboard({
  backgroundColorName,
  backgroundColor,
  imageName,
  resizeMode,
  imageWidth,
  imageHeight,
}) {
  const color = hexToRgb(backgroundColor);
  const imageView = createIosImageView({
    imageName,
    resizeMode,
    imageWidth,
    imageHeight,
  });
  const imageResource = imageName
    ? [`          <image name="${imageName}"/>`]
    : [];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="23504" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="RNSS-ViewController">',
    '    <device id="retina6_12" orientation="portrait" appearance="light"/>',
    '    <dependencies>',
    '        <deployment identifier="iOS"/>',
    '        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="23506"/>',
    '        <capability name="Named colors" minToolsVersion="9.0"/>',
    '        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>',
    '    </dependencies>',
    '    <scenes>',
    '        <scene sceneID="RNSS-Scene">',
    '            <objects>',
    '                <viewController storyboardIdentifier="SplashScreenViewController" id="RNSS-ViewController" sceneMemberID="viewController">',
    '                    <view key="view" userInteractionEnabled="NO" contentMode="scaleToFill" id="RNSS-ContainerView" userLabel="ContainerView">',
    '                        <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>',
    '                        <autoresizingMask key="autoresizingMask" flexibleMaxX="YES" flexibleMaxY="YES"/>',
    ...imageView,
    `                        <color key="backgroundColor" name="${backgroundColorName}"/>`,
    '                    </view>',
    '                </viewController>',
    '                <placeholder placeholderIdentifier="IBFirstResponder" id="RNSS-FirstResponder" userLabel="First Responder" sceneMemberID="firstResponder"/>',
    '            </objects>',
    '            <point key="canvasLocation" x="0.0" y="0.0"/>',
    '        </scene>',
    '    </scenes>',
    '    <resources>',
    ...imageResource,
    `        <namedColor name="${backgroundColorName}">`,
    `            <color red="${color.red}" green="${color.green}" blue="${color.blue}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>`,
    '        </namedColor>',
    '    </resources>',
    '</document>',
    '',
  ].join('\n');
}

function createIosImageView({ imageName, resizeMode, imageWidth, imageHeight }) {
  if (!imageName) {
    return [];
  }

  const fixedSize = imageWidth || imageHeight;
  const frameWidth = imageWidth || 200;
  const frameHeight = imageHeight || 200;
  const constraints = fixedSize
    ? [
        '                              <constraint firstItem="RNSS-SplashImage" firstAttribute="centerX" secondItem="RNSS-ContainerView" secondAttribute="centerX" id="RNSS-centerX"/>',
        '                              <constraint firstItem="RNSS-SplashImage" firstAttribute="centerY" secondItem="RNSS-ContainerView" secondAttribute="centerY" id="RNSS-centerY"/>',
        ...(imageWidth
          ? [
              `                              <constraint firstItem="RNSS-SplashImage" firstAttribute="width" constant="${imageWidth}" id="RNSS-width"/>`,
            ]
          : []),
        ...(imageHeight
          ? [
              `                              <constraint firstItem="RNSS-SplashImage" firstAttribute="height" constant="${imageHeight}" id="RNSS-height"/>`,
            ]
          : []),
      ]
    : [
        '                              <constraint firstItem="RNSS-SplashImage" firstAttribute="leading" secondItem="RNSS-ContainerView" secondAttribute="leading" id="RNSS-leading"/>',
        '                              <constraint firstItem="RNSS-SplashImage" firstAttribute="trailing" secondItem="RNSS-ContainerView" secondAttribute="trailing" id="RNSS-trailing"/>',
        '                              <constraint firstItem="RNSS-SplashImage" firstAttribute="top" secondItem="RNSS-ContainerView" secondAttribute="top" id="RNSS-top"/>',
        '                              <constraint firstItem="RNSS-SplashImage" firstAttribute="bottom" secondItem="RNSS-ContainerView" secondAttribute="bottom" id="RNSS-bottom"/>',
      ];

  return [
    '                          <subviews>',
    `                              <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="${iosContentMode(resizeMode)}" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="${imageName}" translatesAutoresizingMaskIntoConstraints="NO" id="RNSS-SplashImage" userLabel="SplashScreenImage">`,
    `                                  <rect key="frame" x="0.0" y="0.0" width="${frameWidth}" height="${frameHeight}"/>`,
    '                              </imageView>',
    '                          </subviews>',
    '                          <constraints>',
    ...constraints,
    '                          </constraints>',
  ];
}

function iosContentMode(resizeMode) {
  if (resizeMode === 'cover') {
    return 'scaleAspectFill';
  }
  return 'scaleAspectFit';
}

function hexToRgb(value) {
  if (typeof value !== 'string') {
    throw new Error(
      '[react-native-splash-screen-newarch] iOS backgroundColor must be a hex color like #000000.'
    );
  }

  const normalized = value.replace('#', '').trim();
  const hex =
    normalized.length === 3
      ? normalized.split('').map((char) => `${char}${char}`).join('')
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(
      '[react-native-splash-screen-newarch] iOS backgroundColor must be a hex color like #000000.'
    );
  }

  return {
    red: componentToColorString(parseInt(hex.slice(0, 2), 16)),
    green: componentToColorString(parseInt(hex.slice(2, 4), 16)),
    blue: componentToColorString(parseInt(hex.slice(4, 6), 16)),
  };
}

function componentToColorString(value) {
  return (value / 255).toFixed(3);
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = (config, props) => {
  if (!runOncePlugin) {
    const { createRunOncePlugin } = requireExpoConfigPlugins();
    runOncePlugin = createRunOncePlugin(
      withReactNativeSplashScreen,
      pkg.name,
      pkg.version
    );
  }

  return runOncePlugin(config, props);
};

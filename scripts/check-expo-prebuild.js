const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(process.argv[2] || 'expo-example');

function read(relativePath) {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Expo prebuild check failed: missing ${relativePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function findFile(directory, fileName) {
  if (!fs.existsSync(directory)) return null;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const match = findFile(entryPath, fileName);
      if (match) return match;
    } else if (entry.name === fileName) {
      return entryPath;
    }
  }

  return null;
}

function check(name, condition) {
  if (!condition) {
    throw new Error(`Expo prebuild check failed: ${name}`);
  }
}

const mainActivityPath =
  findFile(path.join(projectRoot, 'android/app/src/main/java'), 'MainActivity.kt') ||
  findFile(path.join(projectRoot, 'android/app/src/main/java'), 'MainActivity.java');
check('Android MainActivity exists', mainActivityPath);

const mainActivity = fs.readFileSync(mainActivityPath, 'utf8');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const styles = read('android/app/src/main/res/values/styles.xml');
const systemDrawable = read(
  'android/app/src/main/res/drawable/launch_screen_system.xml'
);

check(
  'Android MainActivity native calls',
  mainActivity.includes('SplashScreen.show(this, true, false)') &&
    mainActivity.includes('SplashScreen.applyPostSplashScreenTheme(this)')
);
check(
  'Android manifest splash theme',
  manifest.includes('@style/Theme.App.SplashScreen') &&
    manifest.includes('com.tomwq.rnsplashscreen.POST_SPLASH_SCREEN_THEME')
);
check(
  'Android launch resources',
  fs.existsSync(
    path.join(projectRoot, 'android/app/src/main/res/layout/launch_screen.xml')
  ) &&
    fs.existsSync(
      path.join(projectRoot, 'android/app/src/main/res/drawable/launch_screen.png')
    ) &&
    styles.includes('postSplashScreenTheme') &&
    systemDrawable.includes('<shape')
);

const iosProjectDirectory = fs
  .readdirSync(path.join(projectRoot, 'ios'), { withFileTypes: true })
  .find(
    (entry) =>
      entry.isDirectory() &&
      fs.existsSync(path.join(projectRoot, 'ios', entry.name, 'Info.plist'))
  );
check('iOS project directory exists', iosProjectDirectory);

const iosProjectPath = path.join('ios', iosProjectDirectory.name);
const appDelegate = read(path.join(iosProjectPath, 'AppDelegate.swift'));
const infoPlist = read(path.join(iosProjectPath, 'Info.plist'));

check(
  'iOS AppDelegate native call',
  appDelegate.includes('import rnsplashscreen') &&
    appDelegate.includes('RNSplashScreen.show()')
);
check(
  'iOS launch resources',
  infoPlist.includes('UILaunchStoryboardName') &&
    infoPlist.includes('SplashScreen') &&
    fs.existsSync(path.join(projectRoot, iosProjectPath, 'SplashScreen.storyboard')) &&
    fs.existsSync(
      path.join(
        projectRoot,
        iosProjectPath,
        'Images.xcassets/SplashScreenImage.imageset/SplashScreenImage.png'
      )
    )
);

console.log('Expo prebuild checks passed');

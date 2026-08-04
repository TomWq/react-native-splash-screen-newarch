const assert = require('node:assert/strict');
const Module = require('node:module');

const originalLoad = Module._load;
let reactNativeMock;

Module._load = function load(request, parent, isMain) {
  if (request === 'react-native') {
    return reactNativeMock;
  }

  return originalLoad.call(this, request, parent, isMain);
};

function loadSplashScreen({ turboModule, bridgeModule, platform = 'ios', dev = true }) {
  global.__DEV__ = dev;
  reactNativeMock = {
    NativeModules: { SplashScreen: bridgeModule },
    Platform: { OS: platform },
    TurboModuleRegistry: { get: () => turboModule },
  };

  for (const modulePath of [
    '../lib/commonjs/index.js',
    '../lib/commonjs/specs/NativeSplashScreen.js',
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }

  return require('../lib/commonjs/index.js').default;
}

function createNativeModule() {
  const calls = [];
  return {
    calls,
    module: {
      show() {
        calls.push(['show']);
      },
      hide(animation, duration, scale, easing) {
        calls.push(['hide', animation, duration, scale, easing]);
      },
      getStartupMetrics() {
        calls.push(['getStartupMetrics']);
        return Promise.resolve({
          showTime: 100,
          hideRequestedTime: 180,
          hiddenTime: 250,
          nativeVisibleDuration: 150,
          hideDuration: 70,
        });
      },
    },
  };
}

async function testTurboModuleAndOptionNormalization() {
  const turbo = createNativeModule();
  const bridge = createNativeModule();
  const splashScreen = loadSplashScreen({
    turboModule: turbo.module,
    bridgeModule: bridge.module,
  });

  splashScreen.show();
  splashScreen.hide();
  splashScreen.hide({ animation: 'fade' });
  splashScreen.hide({ animation: 'fade', duration: -10 });
  splashScreen.hide({ animation: 'scaleFade' });
  splashScreen.hide({ animation: 'scaleFade', duration: 250, scale: 2 });
  splashScreen.hide({ animation: 'scaleFade', duration: 250, scale: 0.5 });
  splashScreen.hide({ animation: 'none', duration: 250, scale: 1.2 });
  splashScreen.hide({ animation: 'slideUpFade', easing: 'linear' });
  splashScreen.hide({ animation: 'zoomOutFade' });
  splashScreen.hide({ animation: 'zoomOutFade', scale: 0.5, easing: 'easeInOut' });
  const metrics = await splashScreen.getStartupMetrics();

  assert.deepEqual(turbo.calls, [
    ['show'],
    ['hide', 'none', 0, 1, 'easeOut'],
    ['hide', 'fade', 250, 1, 'easeOut'],
    ['hide', 'fade', 0, 1, 'easeOut'],
    ['hide', 'scaleFade', 250, 1.08, 'easeOut'],
    ['hide', 'scaleFade', 250, 1.3, 'easeOut'],
    ['hide', 'scaleFade', 250, 1, 'easeOut'],
    ['hide', 'none', 0, 1, 'easeOut'],
    ['hide', 'slideUpFade', 250, 1, 'linear'],
    ['hide', 'zoomOutFade', 250, 0.92, 'easeOut'],
    ['hide', 'zoomOutFade', 250, 0.7, 'easeInOut'],
    ['getStartupMetrics'],
  ]);
  assert.deepEqual(metrics, {
    showTime: 100,
    hideRequestedTime: 180,
    hiddenTime: 250,
    nativeVisibleDuration: 150,
    hideDuration: 70,
  });
  assert.deepEqual(bridge.calls, []);
}

async function testBridgeFallback() {
  const bridge = createNativeModule();
  const splashScreen = loadSplashScreen({ bridgeModule: bridge.module });

  splashScreen.show();
  splashScreen.hide({ animation: 'scaleFade', duration: Number.NaN, scale: Number.NaN });

  assert.deepEqual(bridge.calls, [
    ['show'],
    ['hide', 'scaleFade', 250, 1.08, 'easeOut'],
  ]);
}

async function testMissingNativeModuleDiagnostics() {
  const originalError = console.error;
  const errors = [];
  console.error = (message) => errors.push(message);

  try {
    const nativeSplashScreen = loadSplashScreen({ platform: 'android' });
    nativeSplashScreen.show();
    nativeSplashScreen.hide();
    assert.deepEqual(await nativeSplashScreen.getStartupMetrics(), {
      showTime: null,
      hideRequestedTime: null,
      hiddenTime: null,
      nativeVisibleDuration: null,
      hideDuration: null,
    });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /Native module "SplashScreen" is unavailable/);

    errors.length = 0;
    const webSplashScreen = loadSplashScreen({ platform: 'web' });
    webSplashScreen.show();
    webSplashScreen.hide();
    assert.deepEqual(errors, []);

    const productionSplashScreen = loadSplashScreen({ platform: 'ios', dev: false });
    productionSplashScreen.show();
    productionSplashScreen.hide();
    assert.deepEqual(errors, []);
  } finally {
    console.error = originalError;
  }
}

async function main() {
  try {
    await testTurboModuleAndOptionNormalization();
    await testBridgeFallback();
    await testMissingNativeModuleDiagnostics();
    console.log('JavaScript checks passed');
  } finally {
    Module._load = originalLoad;
    delete global.__DEV__;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

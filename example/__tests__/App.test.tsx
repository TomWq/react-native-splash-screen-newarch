/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import SplashScreen from 'react-native-splash-screen-newarch';
import App from '../App';

jest.mock('react-native-splash-screen-newarch', () => ({
  __esModule: true,
  default: {
    hide: jest.fn(),
    show: jest.fn(),
  },
}));

test('renders and hides the splash screen with the documented options', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });

  expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  expect(SplashScreen.hide).toHaveBeenCalledWith({
    animation: 'zoomOutFade',
    duration: 250,
    scale: 0.92,
    easing: 'easeOut',
  });
});

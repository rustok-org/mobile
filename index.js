/**
 * @format
 */

// crypto.getRandomValues polyfill for the keystore-secret path (Hermes ships no
// native crypto). MUST be first — before any module that may draw randomness.
import 'react-native-get-random-values';

// Reanimated 4 needs the Worklets native bridge initialized at the entry point,
// before App.tsx evaluates.
import 'react-native-worklets';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

/**
 * @format
 */

// Reanimated 4 needs the Worklets native bridge initialized at the entry point,
// before App.tsx evaluates. (crypto.getRandomValues polyfill for the keystore
// path is added in D2 onboarding — not needed by the D0 empty shell.)
import 'react-native-worklets';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

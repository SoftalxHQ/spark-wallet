// Crypto polyfill for React Native
// This must be imported before any StarkNet.js code
import 'react-native-get-random-values';

// Additional polyfills if needed
if (typeof global.crypto === 'undefined') {
  global.crypto = require('react-native-get-random-values');
}

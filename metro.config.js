// Metro is the bundler. withNativeWind turns global.css into native styles as it bundles.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

module.exports = withNativeWind(getDefaultConfig(__dirname), { input: './global.css' });

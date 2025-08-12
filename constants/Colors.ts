/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Spark Wallet theme colors - Premium dark theme
export const SparkColors = {
  brown: '#6B3F1D', // deep brown
  tan: '#D2B48C',   // tan
  gold: '#FFD700',  // gold
  darkGold: '#D4AF37', // darker gold for buttons
  darkBrown: '#2C1A0B', // dark brown background
  black: '#0f0f0f', // pure black
  white: '#ffffff', // pure white
  lightGray: '#dcdcdc', // light gray for descriptions
  darkGray: '#9BA1A6', // dark gray for secondary text
};

export const Colors = {
  light: {
    text: SparkColors.white,
    background: SparkColors.black,
    tint: SparkColors.gold,
    icon: SparkColors.gold,
    tabIconDefault: SparkColors.darkGray,
    tabIconSelected: SparkColors.gold,
    primary: SparkColors.gold,
    secondary: SparkColors.tan,
    accent: SparkColors.gold,
    surface: SparkColors.darkBrown,
    border: SparkColors.brown,
  },
  dark: {
    text: SparkColors.white,
    background: SparkColors.black,
    tint: SparkColors.gold,
    icon: SparkColors.gold,
    tabIconDefault: SparkColors.darkGray,
    tabIconSelected: SparkColors.gold,
    primary: SparkColors.gold,
    secondary: SparkColors.tan,
    accent: SparkColors.gold,
    surface: SparkColors.darkBrown,
    border: SparkColors.brown,
  },
};

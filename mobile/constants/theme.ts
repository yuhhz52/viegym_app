/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Lyft-inspired color palette for modern, clean UI
 */

import { Platform } from 'react-native';

// Lyft-inspired primary colors
const lyftPink = '#EA580C'; // Changed from pink to orange
const lyftPurple = '#352384';
const lyftLightPink = '#FFF7ED'; // Changed from light pink to light orange
const lyftDarkPurple = '#1A0F47';

export const Colors = {
  light: {
    text: '#1A1A1A',
    background: '#FFFFFF',
    tint: lyftPink,
    icon: '#667085',
    tabIconDefault: '#98A2B3',
    tabIconSelected: lyftPink,
    cardBackground: '#F9FAFB',
    border: '#E4E7EC',
    
    // Lyft-specific colors
    primary: lyftPink,
    secondary: lyftPurple,
    accent: lyftLightPink,
    success: '#12B76A',
    warning: '#F79009',
    error: '#F04438',
    info: '#0BA5EC',
    
    // Notification colors
    notificationBg: '#FFFFFF',
    notificationUnread: lyftLightPink,
    notificationBorder: '#F2F4F7',
    
    // Shadow
    shadowColor: '#101828',
  },
  dark: {
    text: '#F9FAFB',
    background: '#0A0A0A',
    tint: lyftPink,
    icon: '#98A2B3',
    tabIconDefault: '#667085',
    tabIconSelected: lyftPink,
    cardBackground: '#1F1F1F',
    border: '#2E2E2E',
    
    // Lyft-specific colors
    primary: lyftPink,
    secondary: '#9B8AFB',
    accent: lyftDarkPurple,
    success: '#47CD89',
    warning: '#FDB022',
    error: '#F97066',
    info: '#36BFFA',
    
    // Notification colors
    notificationBg: '#1F1F1F',
    notificationUnread: '#2D1B3D',
    notificationBorder: '#2E2E2E',
    
    // Shadow
    shadowColor: '#000000',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

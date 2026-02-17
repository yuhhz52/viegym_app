import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card = ({ children, style, variant = 'default' }: CardProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getCardStyle = (): ViewStyle => {
    const baseStyle = {
      backgroundColor: colors.background,
      borderRadius: 12,
    };

    let variantStyle: ViewStyle = {};

    switch (variant) {
      case 'elevated':
        variantStyle = {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        };
        break;
      case 'outlined':
        variantStyle = {
          borderWidth: 1,
          borderColor: colors.text + '20', // 20% opacity
        };
        break;
      default:
        variantStyle = {
          backgroundColor: colorScheme === 'dark' ? colors.text + '10' : colors.text + '05',
        };
        break;
    }

    return { ...baseStyle, ...variantStyle, ...style };
  };

  return <View style={getCardStyle()}>{children}</View>;
};

const styles = StyleSheet.create({
  // Base styles are handled dynamically above
});
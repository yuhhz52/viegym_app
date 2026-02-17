import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({ 
  onPress, 
  title, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  loading = false,
  style,
  textStyle
}: ButtonProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    const sizeStyle = styles[`${size}Button`];
    
    let variantStyle: ViewStyle = {};
    
    switch (variant) {
      case 'primary':
        variantStyle = {
          backgroundColor: '#007AFF',
        };
        break;
      case 'secondary':
        variantStyle = {
          backgroundColor: colors.tint,
        };
        break;
      case 'outline':
        variantStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.tint,
        };
        break;
      case 'ghost':
        variantStyle = {
          backgroundColor: 'transparent',
        };
        break;
    }

    if (disabled || loading) {
      variantStyle.opacity = 0.5;
    }

    return { ...baseStyle, ...sizeStyle, ...variantStyle, ...style };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = styles.text;
    const sizeStyle = styles[`${size}Text`];
    
    let variantTextStyle: TextStyle = {};
    
    switch (variant) {
      case 'primary':
        variantTextStyle = {
          color: '#FFFFFF',
        };
        break;
      case 'secondary':
        variantTextStyle = {
          color: '#FFFFFF',
        };
        break;
      case 'outline':
        variantTextStyle = {
          color: colors.tint,
        };
        break;
      case 'ghost':
        variantTextStyle = {
          color: colors.text,
        };
        break;
    }

    return { ...baseStyle, ...sizeStyle, ...variantTextStyle, ...textStyle };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? colors.tint : '#FFFFFF'} 
          size="small" 
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
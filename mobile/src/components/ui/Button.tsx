import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'surface';
  title?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function Button({ variant = 'primary', title, icon, children, className = '', ...props }: ButtonProps) {
  let bgClass = 'bg-primary';
  let textClass = 'text-on-primary';
  let borderClass = '';

  if (variant === 'secondary') {
    bgClass = 'bg-transparent';
    textClass = 'text-primary';
    borderClass = 'border border-ghost';
  } else if (variant === 'tertiary') {
    bgClass = 'bg-transparent';
    textClass = 'text-on-surface-variant';
  } else if (variant === 'surface') {
    bgClass = 'bg-surface-container-highest';
    textClass = 'text-on-surface';
    borderClass = 'border border-ghost';
  }

  return (
    <TouchableOpacity 
      className={`flex-row items-center justify-center rounded-md px-4 py-2 ${bgClass} ${borderClass} ${className}`}
      {...props}
    >
      {icon && <View className="mr-2">{icon}</View>}
      {title ? (
        <Text className={`font-medium text-sm ${textClass}`}>
          {title}
        </Text>
      ) : children ? (
        <Text className={`font-medium text-sm ${textClass}`}>
          {children}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

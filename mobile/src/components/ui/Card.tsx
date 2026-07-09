import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  level?: 'lowest' | 'low' | 'high' | 'highest';
}

export default function Card({ level = 'high', className = '', children, ...props }: CardProps) {
  let bgClass = 'bg-surface-container-high';
  if (level === 'lowest') bgClass = 'bg-surface-container-lowest';
  else if (level === 'low') bgClass = 'bg-surface-container-low';
  else if (level === 'highest') bgClass = 'bg-surface-container-highest';

  return (
    <View className={`${bgClass} rounded-2xl p-5 border border-outline-variant/15 ${className}`} {...props}>
      {children}
    </View>
  );
}

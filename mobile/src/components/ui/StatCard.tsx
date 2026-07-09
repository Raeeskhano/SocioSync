import React from 'react';
import { View, Text } from 'react-native';
import Card from './Card';
import LinearGradient from 'react-native-linear-gradient';

export default function StatCard({ title, value, change, icon: Icon, trend, hideTrend = false, highlight = false }: any) {
  if (highlight) {
    return (
      <LinearGradient colors={['#bd9dff', '#612b8f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-2xl p-4 h-[140px] justify-between">
        <View className="flex-row justify-between items-start">
          <View className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20">
            {Icon && <Icon color="#ffffff" size={16} />}
          </View>
          {!hideTrend && change && (
            <View className="bg-white/20 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-medium text-white">{change}</Text>
            </View>
          )}
        </View>
        <View className="flex-col">
          <Text className="text-[11px] font-medium mb-0.5 text-white/70">{title}</Text>
          <View className="flex-row items-baseline gap-1">
            <Text className="text-xl font-display font-bold tracking-tight text-white">{value}</Text>
            {hideTrend && change && <Text className="text-[10px] ml-0.5 text-white/60">{change}</Text>}
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <Card level="high" className="flex-col justify-between p-4 h-[140px]">
      <View className="flex-row justify-between items-start">
        <View className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-variant">
          {Icon && <Icon color="#bd9dff" size={16} />}
        </View>
        {!hideTrend && change && (
          <View className="bg-[#1c253d] px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-medium text-primary">{change}</Text>
          </View>
        )}
      </View>
      <View className="flex-col">
        <Text className="text-[11px] font-medium mb-0.5 text-on-surface-variant">{title}</Text>
        <View className="flex-row items-baseline gap-1">
          <Text className="text-xl font-display font-bold tracking-tight text-on-surface">{value}</Text>
          {hideTrend && change && <Text className="text-[10px] ml-0.5 text-on-surface-variant">{change}</Text>}
        </View>
      </View>
    </Card>
  );
}

import React from 'react';
import { View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

export default function EngagementVelocityChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  const reachData = data.map((item, index) => ({
    value: item.reach || 0,
    label: index % 5 === 0 ? (item.date || '').split('-')[2] || '' : '',
  }));

  const actionsData = data.map((item) => ({
    value: item.actions || 0,
  }));

  const screenWidth = Dimensions.get('window').width;

  return (
    <View className="flex-1 w-full justify-center">
      <LineChart
        areaChart
        data={reachData}
        data2={actionsData}
        color1="#bd9dff"
        color2="#ff97b2"
        dataPointsColor1="#bd9dff"
        dataPointsColor2="#ff97b2"
        startFillColor1="#bd9dff"
        startFillColor2="#ff97b2"
        startOpacity1={0.3}
        startOpacity2={0.3}
        endOpacity1={0.0}
        endOpacity2={0.0}
        thickness={2}
        hideRules
        yAxisColor="#192540"
        xAxisColor="#192540"
        yAxisTextStyle={{ color: '#6d758c', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#6d758c', fontSize: 10 }}
        initialSpacing={10}
        noOfSections={4}
        curved
        width={screenWidth - 80}
      />
    </View>
  );
}

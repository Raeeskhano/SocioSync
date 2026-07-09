import { Tabs } from 'expo-router';
import { Home, PenTool, LayoutDashboard, BarChart3, Settings, Users } from 'lucide-react-native';
import { View, Image } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0a1122',
        },
        headerTitleStyle: {
          fontFamily: 'Outfit-Bold',
          color: '#ffffff',
        },
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerLeft: () => (
          <View style={{ marginLeft: 16 }}>
            <Image source={require('../../../assets/logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
          </View>
        ),
        tabBarStyle: {
          backgroundColor: '#0f1930',
          borderTopColor: '#192540',
        },
        tabBarActiveTintColor: '#bd9dff',
        tabBarInactiveTintColor: '#6d758c',
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="publisher"
        options={{
          title: 'Publisher',
          tabBarIcon: ({ color }) => <PenTool color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="integrations"
        options={{
          title: 'Connections',
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="creative-lab"
        options={{
          title: 'AI Lab',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}

import { Tabs, router } from 'expo-router';
import { Home, PenTool, LayoutDashboard, BarChart3, Settings, Users, Bell } from 'lucide-react-native';
import { View, Image, Text, TouchableOpacity } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0a1122',
          borderBottomWidth: 1,
          borderBottomColor: '#192540',
        },
        headerShadowVisible: false,
        headerTitle: '',
        headerLeft: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16, gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0f1930' }}>
              <Image source={require('../../../assets/logo.png')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            </View>
            <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 20, color: '#ffffff', letterSpacing: -0.5 }}>SocioSync</Text>
          </View>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 16 }}>
            <TouchableOpacity>
              <Bell color="#6d758c" size={22} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/publisher')} 
              style={{ backgroundColor: '#192540', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#2e3a59' }}
            >
              <Text style={{ color: '#bd9dff', fontSize: 12, fontFamily: 'Outfit-Bold' }}>Create Post</Text>
            </TouchableOpacity>
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

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors, SparkColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: SparkColors.black,
          borderBottomColor: SparkColors.brown,
          borderBottomWidth: 1,
        },
        headerTintColor: SparkColors.gold,
        headerTitleStyle: {
          color: SparkColors.white,
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: SparkColors.brown,
          borderTopWidth: 1,
        },
        sceneStyle: { backgroundColor: SparkColors.black },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: 'Swap',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)')}
              style={{ marginLeft: 16 }}
            >
              <IconSymbol size={24} name="chevron.left" color={SparkColors.gold} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="arrow.left.arrow.right.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="utility"
        options={{
          title: 'Utility',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)')}
              style={{ marginLeft: 16 }}
            >
              <IconSymbol size={24} name="chevron.left" color={SparkColors.gold} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bolt.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)')}
              style={{ marginLeft: 16 }}
            >
              <IconSymbol size={24} name="chevron.left" color={SparkColors.gold} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

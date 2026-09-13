import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { colors } from '@/constants/design-tokens';

export function AppTabs() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: isDark ? colors.darkAction : colors.primary, tabBarInactiveTintColor: isDark ? colors.darkTextTertiary : colors.neutral500, tabBarShowLabel: false, tabBarStyle: { backgroundColor: isDark ? colors.darkSurface : colors.white, borderTopColor: isDark ? colors.darkBorder : colors.neutral150 } }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} /> }} />
      <Tabs.Screen name="smartwatch" options={{ title: 'Smartwatch', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="watch-outline" size={size} /> }} />
      <Tabs.Screen name="notificacoes" options={{ title: 'Notificações', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="notifications-outline" size={size} /> }} />
      <Tabs.Screen name="configuracoes" options={{ title: 'Configurações', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="settings-outline" size={size} /> }} />
    </Tabs>
  );
}

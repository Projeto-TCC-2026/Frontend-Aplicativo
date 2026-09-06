import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export function AppTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#0C4C8A', tabBarInactiveTintColor: '#7C8DA1', tabBarShowLabel: false }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} /> }} />
      <Tabs.Screen name="smartwatch" options={{ title: 'Smartwatch', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="watch-outline" size={size} /> }} />
      <Tabs.Screen name="notificacoes" options={{ title: 'Notificações', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="notifications-outline" size={size} /> }} />
      <Tabs.Screen name="configuracoes" options={{ title: 'Configurações', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="settings-outline" size={size} /> }} />
    </Tabs>
  );
}

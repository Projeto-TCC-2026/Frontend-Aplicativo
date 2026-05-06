import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

const ICONS = {
  index: { active: 'home', inactive: 'home-outline', label: 'Início' },
  historico: { active: 'time', inactive: 'time-outline', label: 'Histórico' },
  configuracoes: { active: 'settings', inactive: 'settings-outline', label: 'Configurações' },
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className="absolute bottom-6 left-5 right-5 flex-row items-center justify-around rounded-2xl px-2 py-2"
      style={{
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      }}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconConfig = ICONS[route.name as keyof typeof ICONS];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const color = isFocused ? '#0a7ea4' : '#9BA1A6';

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            className="flex-1 items-center justify-center py-1.5"
            style={{ opacity: isFocused ? 1 : 0.7 }}>
            <Ionicons
              name={isFocused ? iconConfig.active : iconConfig.inactive}
              size={22}
              color={color}
            />
            <Text
              className="mt-0.5 text-[10px] font-medium"
              style={{ color }}>
              {iconConfig.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

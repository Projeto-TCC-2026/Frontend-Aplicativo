import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <SafeAreaView className='flex-1' style={{ backgroundColor: Colors[colorScheme].background }}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Início</Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme].icon }]}>
          Bem-vindo ao app
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
  },
});

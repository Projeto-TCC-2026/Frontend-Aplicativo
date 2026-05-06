import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 items-center justify-center gap-2">
        <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Início
        </Text>
        <Text className="text-base text-neutral-500 dark:text-neutral-400">
          Bem-vindo ao app
        </Text>
      </View>
    </SafeAreaView>
  );
}

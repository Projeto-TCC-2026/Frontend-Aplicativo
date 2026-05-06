import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoricoScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 items-center justify-center gap-2">
        <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Histórico
        </Text>
      </View>
    </SafeAreaView>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function CheckinCard() {
  return (
    <Pressable
      onPress={() => router.push('/checkin-diario' as any)}
      className="overflow-hidden rounded-3xl bg-brand p-6 active:opacity-90"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
      }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="mb-1 text-sm font-medium text-white/80">Hoje</Text>
          <Text className="mb-2 text-2xl font-bold text-white">Check-in Diário</Text>
          <Text className="text-sm text-white/90">
            Registre como você está se sentindo
          </Text>
        </View>
        <View className="ml-4 rounded-full bg-white/20 p-3">
          <Ionicons name="clipboard" size={32} color="#fff" />
        </View>
      </View>
      <View className="mt-4 flex-row items-center">
        <Ionicons name="chevron-forward" size={16} color="#fff" />
        <Text className="ml-1 text-sm font-semibold text-white">Iniciar check-in</Text>
      </View>
    </Pressable>
  );
}

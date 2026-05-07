import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export function SmartwatchCard() {
  // Dados mockados
  const heartRate = 72;
  const steps = 5847;
  const oxygen = 98;

  return (
    <View
      className="overflow-hidden rounded-3xl bg-white p-5 dark:bg-neutral-900"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Smartwatch
        </Text>
        <View className="rounded-full bg-brand/10 p-2">
          <Ionicons name="watch" size={18} color="#0a7ea4" />
        </View>
      </View>

      <View className="gap-3">
        {/* Batimentos */}
        <View className="flex-row items-center justify-between rounded-2xl bg-red-50 p-4 dark:bg-red-950/30">
          <View className="flex-row items-center gap-3">
            <View className="rounded-full bg-red-500/20 p-2">
              <Ionicons name="heart" size={20} color="#ef4444" />
            </View>
            <View>
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                Batimentos
              </Text>
              <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {heartRate}
              </Text>
            </View>
          </View>
          <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            BPM
          </Text>
        </View>

        {/* Passos e Oxigenação */}
        <View className="flex-row gap-3">
          {/* Passos */}
          <View className="flex-1 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
            <View className="mb-2 rounded-full bg-blue-500/20 p-2 self-start">
              <Ionicons name="footsteps" size={18} color="#3b82f6" />
            </View>
            <Text className="text-xs text-neutral-600 dark:text-neutral-400">Passos</Text>
            <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {steps.toLocaleString()}
            </Text>
          </View>

          {/* Oxigenação */}
          <View className="flex-1 rounded-2xl bg-cyan-50 p-4 dark:bg-cyan-950/30">
            <View className="mb-2 rounded-full bg-cyan-500/20 p-2 self-start">
              <Ionicons name="water" size={18} color="#06b6d4" />
            </View>
            <Text className="text-xs text-neutral-600 dark:text-neutral-400">SpO₂</Text>
            <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {oxygen}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

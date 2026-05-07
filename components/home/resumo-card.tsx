import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export function ResumoCard() {
  // Dados mockados
  const resumo = {
    status: 'Recuperação Estável',
    statusColor: '#10b981', // green
    statusIcon: 'checkmark-circle' as const,
    alertas: 0,
    diasPosCirurgia: 12,
    mensagem: 'Continue realizando o check-in diário',
  };

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
          Resumo da Recuperação
        </Text>
        <View className="rounded-full bg-green-500/10 p-1.5">
          <Ionicons name="stats-chart" size={18} color="#10b981" />
        </View>
      </View>

      {/* Status Principal */}
      <View className="mb-4 rounded-2xl bg-green-50 p-4 dark:bg-green-950/30">
        <View className="mb-2 flex-row items-center gap-2">
          <Ionicons name={resumo.statusIcon} size={24} color={resumo.statusColor} />
          <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {resumo.status}
          </Text>
        </View>
        <Text className="text-sm text-neutral-600 dark:text-neutral-400">
          {resumo.mensagem}
        </Text>
      </View>

      {/* Métricas */}
      <View className="flex-row gap-3">
        {/* Dias pós-cirurgia */}
        <View className="flex-1 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800">
          <Text className="mb-1 text-xs text-neutral-600 dark:text-neutral-400">
            Dias pós-cirurgia
          </Text>
          <Text className="text-2xl font-bold text-brand">{resumo.diasPosCirurgia}</Text>
        </View>

        {/* Alertas */}
        <View className="flex-1 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800">
          <Text className="mb-1 text-xs text-neutral-600 dark:text-neutral-400">
            Alertas críticos
          </Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-2xl font-bold text-green-500">{resumo.alertas}</Text>
            <Ionicons name="shield-checkmark" size={16} color="#10b981" />
          </View>
        </View>
      </View>
    </View>
  );
}

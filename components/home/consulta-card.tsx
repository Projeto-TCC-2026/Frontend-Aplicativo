import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export function ConsultaCard() {
  // Dados mockados
  const proximaConsulta = {
    data: '15 de Maio',
    hora: '14:30',
    medico: 'Dr. Carlos Silva',
    tipo: 'Consulta de Retorno',
    diasRestantes: 9,
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
          Próxima Consulta
        </Text>
        <View className="rounded-full bg-purple-500/10 p-1.5">
          <Ionicons name="calendar" size={18} color="#a855f7" />
        </View>
      </View>

      <View className="mb-4 rounded-2xl bg-purple-50 p-4 dark:bg-purple-950/30">
        <View className="mb-3 flex-row items-center gap-2">
          <Ionicons name="time" size={20} color="#a855f7" />
          <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {proximaConsulta.data} às {proximaConsulta.hora}
          </Text>
        </View>

        <View className="mb-2 flex-row items-center gap-2">
          <Ionicons name="person" size={18} color="#9BA1A6" />
          <Text className="text-sm text-neutral-700 dark:text-neutral-300">
            {proximaConsulta.medico}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Ionicons name="medical" size={18} color="#9BA1A6" />
          <Text className="text-sm text-neutral-700 dark:text-neutral-300">
            {proximaConsulta.tipo}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between rounded-xl bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
        <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Faltam {proximaConsulta.diasRestantes} dias
        </Text>
        <Ionicons name="notifications" size={16} color="#0a7ea4" />
      </View>
    </View>
  );
}

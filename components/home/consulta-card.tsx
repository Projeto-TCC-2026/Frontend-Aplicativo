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
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="flex-1 text-base font-bold text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
          Consulta
        </Text>
        <View className="ml-2 rounded-full bg-purple-500/10 p-2">
          <Ionicons name="calendar" size={16} color="#a855f7" />
        </View>
      </View>

      <View className="mb-3 rounded-2xl bg-purple-50 p-3 dark:bg-purple-950/30">
        <View className="mb-2 flex-row items-start gap-2">
          <Ionicons name="time" size={18} color="#a855f7" style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {proximaConsulta.data}
            </Text>
            <Text className="text-xs text-neutral-600 dark:text-neutral-400">
              {proximaConsulta.hora}
            </Text>
          </View>
        </View>

        <View className="mb-2 flex-row items-start gap-2">
          <Ionicons name="person" size={16} color="#9BA1A6" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-xs text-neutral-700 dark:text-neutral-300" numberOfLines={2}>
            {proximaConsulta.medico}
          </Text>
        </View>

        <View className="flex-row items-start gap-2">
          <Ionicons name="medical" size={16} color="#9BA1A6" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-xs text-neutral-700 dark:text-neutral-300" numberOfLines={2}>
            {proximaConsulta.tipo}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between rounded-xl bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
        <Text className="flex-1 text-xs font-medium text-neutral-600 dark:text-neutral-400" numberOfLines={1}>
          Faltam {proximaConsulta.diasRestantes} dias
        </Text>
        <Ionicons name="notifications" size={16} color="#0a7ea4" />
      </View>
    </View>
  );
}

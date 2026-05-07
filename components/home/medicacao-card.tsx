import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function MedicacaoCard() {
  // Estado local para controlar se a medicação foi tomada
  const [tomado, setTomado] = useState(false);

  // Dados mockados
  const medicacao = {
    nome: 'Dipirona',
    horario: '14:00',
    dose: '1 comprimido',
  };

  const handleMarcarComoTomado = () => {
    setTomado(true);
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
      {/* Header */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="flex-1 text-lg font-bold text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
          Medicação
        </Text>
        <View className="ml-2 rounded-full bg-amber-500/10 p-2">
          <Ionicons name="medical" size={18} color="#f59e0b" />
        </View>
      </View>

      {/* Área Principal */}
      <View className="mb-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/30">
        <Text className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Próximo remédio
        </Text>
        
        <View className="mb-3 flex-row items-center gap-2">
          <Ionicons name="time" size={20} color="#f59e0b" />
          <View className="flex-1">
            <Text className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {medicacao.nome}
            </Text>
            <Text className="text-sm text-neutral-600 dark:text-neutral-400">
              às {medicacao.horario}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Ionicons name="medkit" size={18} color="#9BA1A6" />
          <Text className="text-sm text-neutral-700 dark:text-neutral-300">
            Dose: {medicacao.dose}
          </Text>
        </View>
      </View>

      {/* Status e Botão */}
      <View className="flex-row items-center gap-3">
        {/* Badge de Status */}
        <View
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 py-2.5 ${
            tomado
              ? 'bg-green-100 dark:bg-green-950/30'
              : 'bg-amber-100 dark:bg-amber-950/30'
          }`}>
          <Ionicons
            name={tomado ? 'checkmark-circle' : 'alert-circle'}
            size={16}
            color={tomado ? '#10b981' : '#f59e0b'}
          />
          <Text
            className={`text-xs font-semibold ${
              tomado
                ? 'text-green-700 dark:text-green-400'
                : 'text-amber-700 dark:text-amber-400'
            }`}>
            {tomado ? 'Tomado' : 'Pendente'}
          </Text>
        </View>

        {/* Botão Marcar como Tomado */}
        {!tomado && (
          <Pressable
            onPress={handleMarcarComoTomado}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 active:opacity-80">
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text className="text-xs font-semibold text-white">Marcar</Text>
          </Pressable>
        )}

        {/* Quando tomado, mostrar ícone de confirmação */}
        {tomado && (
          <View className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-green-500 px-3 py-2.5">
            <Ionicons name="checkmark-done" size={16} color="#fff" />
            <Text className="text-xs font-semibold text-white">Confirmado</Text>
          </View>
        )}
      </View>
    </View>
  );
}

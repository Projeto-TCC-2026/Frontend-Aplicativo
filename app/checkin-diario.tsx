import { Ionicons } from '@expo/vector-icons';
import Slider from "@react-native-community/slider";
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

type Medicacao = {
  id: string;
  nome: string;
  dosagem: string;
  horario: string;
};

export default function CheckinDiarioScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [nivelDor, setNivelDor] = useState(0);
  const [temperatura, setTemperatura] = useState('');
  const [inchacoNivel, setInchacoNivel] = useState('');
  const [medicacoes, setMedicacoes] = useState<Medicacao[]>([]);
  const [observacoes, setObservacoes] = useState('');

  const adicionarMedicacao = () => {
    setMedicacoes([
      ...medicacoes,
      { id: Date.now().toString(), nome: '', dosagem: '', horario: '' },
    ]);
  };

  const removerMedicacao = (id: string) => {
    setMedicacoes(medicacoes.filter((med) => med.id !== id));
  };

  const atualizarMedicacao = (id: string, campo: keyof Medicacao, valor: string) => {
    setMedicacoes(
      medicacoes.map((med) => (med.id === id ? { ...med, [campo]: valor } : med))
    );
  };

  const getCorDor = (nivel: number) => {
    if (nivel === 0) return '#9BA1A6'; // Sem dor
    if (nivel <= 3) return '#99D5E0'; // Dor leve - azul claro
    if (nivel <= 6) return '#0C4C8A'; // Dor moderada - azul médio
    return '#dc2626'; // Dor forte - vermelho
  };

  const handleSubmit = () => {
    console.log({
      nivelDor,
      temperatura,
      inchacoNivel,
      medicacoes,
      observacoes,
    });
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Check-in Diário',
          headerBackTitle: 'Voltar',
        }}
      />
      <SafeAreaView edges={['bottom']} className="flex-1 bg-white dark:bg-neutral-950">
        <ScrollView className="flex-1 px-4 py-6">
          {/* Nível da Dor - Slider */}
          <View className="mb-8">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Nível da Dor
              </Text>
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: getCorDor(nivelDor) }}>
                <Text className="text-sm font-bold text-white">{nivelDor}</Text>
              </View>
            </View>
            <Slider
              value={nivelDor}
              onValueChange={setNivelDor}
              minimumValue={0}
              maximumValue={10}
              step={1}
              minimumTrackTintColor={getCorDor(nivelDor)}
              maximumTrackTintColor="#d4d4d4"
              thumbTintColor={getCorDor(nivelDor)}
            />
            <View className="flex-row justify-between px-1">
              <Text className="text-xs text-neutral-500">Sem dor</Text>
              <Text className="text-xs text-neutral-500">Dor intensa</Text>
            </View>
          </View>

          {/* Temperatura */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Temperatura Corporal (°C)
            </Text>
            <TextInput
              value={temperatura}
              onChangeText={setTemperatura}
              placeholder="Ex: 36.5"
              keyboardType="decimal-pad"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
            />
          </View>

          {/* Nível de Inchaço */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Nível de Inchaço (0-10)
            </Text>
            <TextInput
              value={inchacoNivel}
              onChangeText={setInchacoNivel}
              placeholder="Ex: 2"
              keyboardType="numeric"
              maxLength={2}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
            />
          </View>

          {/* Medicações - Dinâmico */}
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Medicações Tomadas Hoje
              </Text>
              <Pressable
                onPress={adicionarMedicacao}
                className="flex-row items-center gap-1 rounded-lg px-3 py-1.5"
                style={{ backgroundColor: '#0C4C8A' }}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text className="text-xs font-semibold text-white">Adicionar</Text>
              </Pressable>
            </View>

            {medicacoes.map((med) => (
              <View
                key={med.id}
                className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Medicação
                  </Text>
                  <Pressable onPress={() => removerMedicacao(med.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </Pressable>
                </View>
                <TextInput
                  value={med.nome}
                  onChangeText={(valor) => atualizarMedicacao(med.id, 'nome', valor)}
                  placeholder="Nome do medicamento"
                  className="mb-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
                />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <TextInput
                      value={med.dosagem}
                      onChangeText={(valor) => atualizarMedicacao(med.id, 'dosagem', valor)}
                      placeholder="Dosagem"
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
                    />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      value={med.horario}
                      onChangeText={(valor) => {
                        // Formata para HH:MM
                        const numeros = valor.replace(/\D/g, '');
                        let formatado = numeros;
                        if (numeros.length >= 2) {
                          formatado = numeros.slice(0, 2) + ':' + numeros.slice(2, 4);
                        }
                        atualizarMedicacao(med.id, 'horario', formatado);
                      }}
                      placeholder="HH:MM"
                      keyboardType="numeric"
                      maxLength={5}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
                    />
                  </View>
                </View>
              </View>
            ))}

            {medicacoes.length === 0 && (
              <Text className="text-center text-sm text-neutral-400">
                Nenhuma medicação adicionada
              </Text>
            )}
          </View>

          {/* Observações */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Observações Adicionais
            </Text>
            <TextInput
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Descreva como você está se sentindo..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
            />
          </View>

          {/* Botão Enviar */}
          <Pressable
            onPress={handleSubmit}
            className="mb-8 rounded-xl py-4 active:opacity-80"
            style={{ backgroundColor: '#0C4C8A' }}>
            <Text className="text-center text-base font-semibold text-white">
              Enviar Check-in
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

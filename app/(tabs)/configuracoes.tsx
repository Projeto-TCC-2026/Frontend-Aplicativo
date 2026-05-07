import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ConfiguracoesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLogout = () => {
    // Aqui você pode adicionar lógica de logout (limpar token, etc)
    router.replace('/login' as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 px-4 py-6 pb-24">
        <Text className="mb-6 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Configurações
        </Text>

        {/* Botão Check-in Diário */}
        <Pressable
          onPress={() => router.push('/checkin-diario' as any)}
          className="mb-4 flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 active:opacity-70 dark:border-neutral-800 dark:bg-neutral-900">
          <View className="flex-row items-center gap-3">
            <View className="rounded-full bg-brand/10 p-2">
              <Ionicons name="clipboard" size={24} color="#0a7ea4" />
            </View>
            <View>
              <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Check-in Diário
              </Text>
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                Registre seu pós-operatório
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? '#9BA1A6' : '#687076'}
          />
        </Pressable>

        {/* Espaçador */}
        <View className="flex-1" />

        {/* Botão Sair */}
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 active:opacity-70 dark:border-red-900 dark:bg-red-950">
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text className="text-sm font-semibold text-red-600 dark:text-red-500">
            Sair da Conta
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

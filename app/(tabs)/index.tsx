import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckinCard } from '@/components/home/checkin-card';
import { ConsultaCard } from '@/components/home/consulta-card';
import { EvolucaoCard } from '@/components/home/evolucao-card';
import { MedicacaoCard } from '@/components/home/medicacao-card';
import { ResumoCard } from '@/components/home/resumo-card';
import { SmartwatchCard } from '@/components/home/smartwatch-card';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            Quarta-feira, 6 de Maio
          </Text>
          <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Resumo
          </Text>
        </View>

        {/* Cards */}
        <View className="gap-4 px-5 py-4">
          {/* Card de Check-in Diário - Destaque */}
          <CheckinCard />

          {/* Card de Smartwatch */}
          <SmartwatchCard />

          {/* Card de Medicação */}
          <MedicacaoCard />

          {/* Grid de 2 colunas */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <ConsultaCard />
            </View>
            <View className="flex-1">
              <ResumoCard />
            </View>
          </View>

          {/* Card de Evolução */}
          <EvolucaoCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

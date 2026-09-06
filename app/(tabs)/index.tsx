import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Screen, StatusBadge } from '@/components/ui';
import { getLastCheckinDate, toDateKey } from '@/src/infrastructure/api/daily-checkin-store';

export default function Home() {
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  useEffect(() => {
    void getLastCheckinDate().then((date) => setHasCheckedInToday(date === toDateKey(new Date())));
  }, []);

  return (
    <Screen className="gap-5 bg-neutral-100 p-5">
      <View>
        <Text className="font-display text-[30px] font-extrabold text-neutral-900">Olá, paciente</Text>
        <Text className="mt-1 font-body text-[15px] text-neutral-700">Acompanhe sua recuperação hoje.</Text>
      </View>

      <Card title="Resumo de hoje" subtitle="Seu acompanhamento diário">
        <View className="flex-row justify-between">
          <View className="gap-1">
            <Text className="font-body text-xs text-neutral-500">Check-in</Text>
            <StatusBadge label={hasCheckedInToday ? 'Concluído' : 'Pendente'} tone={hasCheckedInToday ? 'success' : 'attention'} />
          </View>
          <View className="gap-1">
            <Text className="font-body text-xs text-neutral-500">Procedimentos ativos</Text>
            <Text className="font-data text-[22px] font-semibold text-neutral-900">--</Text>
          </View>
        </View>
      </Card>

      <Card title="Check-in diário" subtitle={hasCheckedInToday ? 'Você já enviou seu check-in hoje.' : 'Reserve alguns minutos para registrar como você está.'}>
        <Button disabled={hasCheckedInToday} variant={hasCheckedInToday ? 'secondary' : 'primary'} onPress={() => router.push('/checkin')}>
          {hasCheckedInToday ? 'Check-in concluído hoje' : 'Fazer check-in'}
        </Button>
      </Card>
    </Screen>
  );
}

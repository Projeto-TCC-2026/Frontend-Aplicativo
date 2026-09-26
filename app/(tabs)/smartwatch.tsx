import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Button, Card, Screen } from '@/components/ui';
import { connectToHealth, type HealthSnapshot } from '@/src/infrastructure/health/health-service';

export default function Smartwatch() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const IN_DEVELOPMENT = process.env.NODE_ENV === 'development';

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await connectToHealth());
    } catch (connectionError) {
      setError(connectionError instanceof Error ? connectionError.message : 'Não foi possível acessar seus dados de saúde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const connectionTask = setTimeout(() => {
      void connect();
    }, 0);
    return () => clearTimeout(connectionTask);
  }, [connect]);

  return (
    <Screen className="bg-neutral-100 p-8 dark:bg-theme-dark-background">
      <ScrollView contentContainerClassName="flex-grow gap-5">
        <View>
          <Text className="font-display text-[30px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">Meu smartwatch</Text>
          <Text className="mt-1 font-body text-[15px] text-neutral-700 dark:text-theme-dark-text-secondary">Leia dados compartilhados pelo app de saúde do seu telefone.</Text>
        </View>

        <View className="mt-6">
          <Card title="Dados de saúde" subtitle={snapshot ? `Fonte: ${snapshot.source}` : 'Aguardando conexão e permissões'}>
            {loading ? (
              <View className="items-center py-6">
                <ActivityIndicator />
                <Text className="mt-3 font-body text-neutral-700 dark:text-theme-dark-text-secondary">Solicitando acesso...</Text>
              </View>
            ) : error ? (
              <View>
                <Text className="font-body text-semantic-critical">{error}</Text>
                <View className="mt-4">
                  <Button onPress={() => void connect()}>Tentar novamente</Button>
                </View>
              </View>
            ) : (
              <View className="gap-3">
                <HealthValue label="Frequência cardíaca" value={snapshot?.heartRate != null ? `${snapshot.heartRate} bpm` : 'Sem registro recente'} />
                <HealthValue label="Passos hoje" value={snapshot?.steps != null ? snapshot.steps.toLocaleString('pt-BR') : 'Sem registro hoje'} />
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function HealthValue({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-150 pb-3 dark:border-theme-dark-border">
      <Text className="font-body text-[15px] text-neutral-700 dark:text-theme-dark-text-secondary">{label}</Text>
      <Text className="font-data text-[15px] font-bold text-neutral-900 dark:text-theme-dark-text-primary">{value}</Text>
    </View>
  );
}

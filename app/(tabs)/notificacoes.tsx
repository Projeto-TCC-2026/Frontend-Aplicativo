import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, useColorScheme, View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, LoadingState, Screen, StatusBadge } from '@/components/ui';
import type { PatientAlert } from '@/src/domain/alert';
import { createApiClient } from '@/src/infrastructure/api/api-config';
import { colors } from '@/constants/design-tokens';

const PAGE_SIZE = 20;

export default function Notifications() {
  const [alerts, setAlerts] = useState<PatientAlert[]>([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async (requestedPage = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const result = await createApiClient().getRecentAlerts(requestedPage, PAGE_SIZE);
      setAlerts(current => append ? [...current, ...result.content] : result.content);
      setPage(result.number);
      setLastPage(result.last);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar seus alertas.');
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => void loadAlerts(), 0);
    return () => clearTimeout(loadTimer);
  }, [loadAlerts]);

  if (loading) {
    return <Screen className="bg-neutral-100 dark:bg-theme-dark-background"><LoadingState fullPage text="Carregando alertas..." /></Screen>;
  }

  return (
    <Screen className="bg-neutral-100 p-8 dark:bg-theme-dark-background">
      <ScrollView contentContainerClassName="flex-grow gap-5 pb-10">
        <View>
          <Text className="font-display text-[30px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">Alertas</Text>
          <Text className="mt-1 font-body text-[15px] text-neutral-700 dark:text-theme-dark-text-secondary">Ocorrências identificadas nos últimos 7 dias.</Text>
        </View>

        {error ? <ErrorState description={error} onRetry={() => void loadAlerts()} /> : null}
        {!error && alerts.length === 0 ? (
          <EmptyState title="Nenhum alerta recente" description="Nenhuma informação fora da faixa normal foi identificada nos últimos 7 dias." />
        ) : null}
        {!error ? alerts.map(alert => <AlertCard key={alert.id} alert={alert} />) : null}
        {!error && !lastPage ? (
          <Button variant="secondary" loading={loadingMore} loadingText="Carregando..." onPress={() => void loadAlerts(page + 1, true)}>
            Carregar mais alertas
          </Button>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function AlertCard({ alert }: { alert: PatientAlert }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tone = alert.severity.toUpperCase().includes('CRIT') ? 'critical'
    : alert.severity.toUpperCase().includes('ATEN') ? 'attention' : 'info';
  const iconColor = tone === 'critical' ? colors.critical : tone === 'attention' ? colors.attention : isDark ? colors.darkAction : colors.info;
  const date = new Date(alert.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <Card padding="md">
      <View className="flex-row items-start gap-3">
        <View className={`mt-0.5 h-9 w-9 items-center justify-center rounded-full ${tone === 'critical' ? 'bg-semantic-critical-bg dark:bg-theme-dark-critical-background' : tone === 'attention' ? 'bg-semantic-attention-bg dark:bg-theme-dark-attention-background' : 'bg-semantic-info-bg dark:bg-theme-dark-info-background'}`}>
          <Ionicons color={iconColor} name="warning-outline" size={20} />
        </View>
        <View className="flex-1 gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">{alert.title}</Text>
            <StatusBadge label={alert.severity} tone={tone} />
          </View>
          {alert.description ? <Text className="font-body text-sm leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">{alert.description}</Text> : null}
          <Text className="font-data text-[11px] text-neutral-500 dark:text-theme-dark-text-tertiary">{date}</Text>
        </View>
      </View>
    </Card>
  );
}

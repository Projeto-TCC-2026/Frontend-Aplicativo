import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, useColorScheme, View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { colors } from '@/constants/design-tokens';
import { openAlertResponseScreen } from '@/src/application/alert-response';
import {
  formatBackendAlertDate,
  getAlertResponseRemainingSeconds,
  needsPatientResponse,
  type PatientAlert
} from '@/src/domain/alert';
import { createApiClient } from '@/src/infrastructure/api/api-config';

const PAGE_SIZE = 20;

export default function Notifications() {
  const [alerts, setAlerts] = useState<PatientAlert[]>([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async (requestedPage = 0, append = false, pullToRefresh = false) => {
    if (append) {
      setLoadingMore(true);
    } else if (!pullToRefresh) {
      setLoading(true);
    }
    if (pullToRefresh) setRefreshing(true);
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
      if (pullToRefresh) setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    const loadTimer = setTimeout(() => void loadAlerts(), 0);

    return () => {
      clearTimeout(loadTimer);
    };
  }, [loadAlerts]));

  if (loading) {
    return <Screen className="bg-neutral-100 dark:bg-theme-dark-background"><LoadingState fullPage text="Carregando alertas..." /></Screen>;
  }

  return (
    <Screen className="bg-neutral-100 dark:bg-theme-dark-background">
      <ScrollView
        contentContainerClassName="flex-grow gap-5 pt-8 pb-[80px] px-8"
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            refreshing={refreshing}
            onRefresh={() => void loadAlerts(0, false, true)}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="font-display text-[30px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">Alertas</Text>
          <Text className="mt-1 font-body text-[15px] text-neutral-700 dark:text-theme-dark-text-secondary">Ocorrências identificadas nos últimos 7 dias.</Text>
          <View className="mt-3 h-[3px] w-full rounded-full bg-neutral-400/20" />
        </View>

        {error ? <ErrorState description={error} onRetry={() => void loadAlerts()} /> : null}
        {!error && alerts.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState title="Nenhum alerta recente" description="Nenhuma informação fora da faixa normal foi identificada nos últimos 7 dias." />
          </View>
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
  const date = formatBackendAlertDate(alert.createdAt);
  const awaitingResponse = needsPatientResponse(alert.status);
  const [remainingSeconds, setRemainingSeconds] = useState(
    () => getAlertResponseRemainingSeconds(alert.createdAt),
  );

  useEffect(() => {
    if (!awaitingResponse) return;

    const updateRemainingTime = () => {
      setRemainingSeconds(getAlertResponseRemainingSeconds(alert.createdAt));
    };
    updateRemainingTime();
    const timer = setInterval(updateRemainingTime, 1_000);
    return () => clearInterval(timer);
  }, [alert.createdAt, awaitingResponse]);

  const responseAvailable = awaitingResponse && remainingSeconds > 0;
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecondsInMinute = remainingSeconds % 60;
  const countdown = `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSecondsInMinute).padStart(2, '0')}`;

  return (
    <Card padding="md">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Ionicons color={iconColor} name="warning-outline" size={30} />
          <Text className="font-data text-[11px] text-neutral-500 dark:text-theme-dark-text-tertiary">{date}</Text>
        </View>
        <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">{alert.title}</Text>
        {alert.description ? <Text className="font-body text-sm leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">{alert.description}</Text> : null}
        {responseAvailable ? (
          <View className='pt-4 pb-2'>
            <Button
              accessibilityLabel={`Responder ao alerta ${alert.title}`}
              onPress={() => openAlertResponseScreen(alert.id)}
              size="sm"
              variant="secondary"
            >
              Responder
            </Button>
          </View>
        ) : awaitingResponse ? (
          <Text className="font-body text-sm font-semibold text-neutral-500 dark:text-theme-dark-text-tertiary">
            Prazo de resposta encerrado
          </Text>
        ) : null}
        {responseAvailable ? (
          <Text className="font-data text-xs text-neutral-500 dark:text-theme-dark-text-tertiary">
            Prazo para responder: {countdown}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

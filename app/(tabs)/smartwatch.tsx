import { Button, Card, Screen } from '@/components/ui';
import type { HealthSnapshot } from '@/src/infrastructure/health/health-service';
import {
  disableSmartwatchMonitoring,
  enableSmartwatchMonitoring,
  getSmartwatchMonitoringState,
} from '@/src/infrastructure/health/smartwatch-background-service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

// Só para props que não aceitam className (ícone e spinner).
// Mantenha igual ao border-[#6B7280] usado no botão.
const GRAY = '#6B7280';

export default function Smartwatch() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [lastCollectedAt, setLastCollectedAt] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Evita que uma releitura do estado sobrescreva a UI no meio de ativar/desativar.
  const updatingRef = useRef(false);

  const refreshState = useCallback(async () => {
    if (updatingRef.current) return;

    try {
      const state = await getSmartwatchMonitoringState();
      setEnabled(state.enabled);
      setSnapshot(state.snapshot);
      setLastCollectedAt(state.lastCollectedAt);
    } catch (stateError) {
      setError(
        stateError instanceof Error
          ? stateError.message
          : 'Não foi possível carregar o estado do smartwatch.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Recupera o estado ao abrir a tela e sempre que ela volta ao foco.
  useFocusEffect(
    useCallback(() => {
      void refreshState();
    }, [refreshState]),
  );

  // Atualiza também quando o app volta do segundo plano (pode ter havido coleta nesse meio tempo).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') void refreshState();
    });
    return () => subscription.remove();
  }, [refreshState]);

  const runUpdate = async (action: () => Promise<unknown>, fallbackMessage: string) => {
    updatingRef.current = true;
    setUpdating(true);
    setError(null);

    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : fallbackMessage);
    } finally {
      updatingRef.current = false;
      setUpdating(false);
      await refreshState();
    }
  };

  const handleButtonPress = () => {
    if (enabled) {
      setConfirmVisible(true);
      return;
    }
    void runUpdate(enableSmartwatchMonitoring, 'Não foi possível ativar a coleta do smartwatch.');
  };

  const handleConfirmStop = () => {
    setConfirmVisible(false);
    void runUpdate(disableSmartwatchMonitoring, 'Não foi possível desativar a coleta do smartwatch.');
  };

  const isAndroid = Platform.OS === 'android';
  const collectedAtLabel = formatCollectedAt(lastCollectedAt);

  const statusTitle = updating
    ? enabled
      ? 'Desativando...'
      : 'Ativando...'
    : enabled
      ? 'Coleta em execução'
      : 'Coleta desligada';

  return (
    <Screen className="bg-neutral-100 p-8 dark:bg-theme-dark-background">
      <ScrollView contentContainerClassName="flex-grow gap-5">
        <View>
          <Text className="font-display text-[30px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">Meu smartwatch</Text>
          <Text className="mt-1 font-body text-[15px] text-neutral-700 dark:text-theme-dark-text-secondary">Acompanhamento 24 horas com dados do seu smartwatch</Text>
        </View>

        <View className="mt-4 items-center">
          {loading ? (
            <View className="items-center py-16">
              <ActivityIndicator />
              <Text className="mt-3 font-body text-neutral-700 dark:text-theme-dark-text-secondary">Carregando preferências...</Text>
            </View>
          ) : (
            <>
              <MonitoringButton
                running={enabled}
                busy={updating}
                disabled={!isAndroid || updating}
                onPress={handleButtonPress}
              />

              {!isAndroid ? (
                <Text className="mt-1 px-4 text-center font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  A coleta automática do smartwatch está disponível apenas no Android.
                </Text>
              ) : null}

              {error ? (
                <Text className="mt-4 text-center font-body text-[14px] text-semantic-critical">{error}</Text>
              ) : null}
            </>
          )}
        </View>

        {enabled && (
          <View>
            <Card
              title="Últimos dados coletados"
              subtitle={
                snapshot
                  ? `${collectedAtLabel ? `${collectedAtLabel} · ` : ''}Fonte: ${snapshot.source}`
                  : 'Nenhuma coleta realizada ainda'
              }
            >
              {snapshot ? (
                <View className="gap-3">
                  <HealthValue label="Frequência cardíaca" value={snapshot.heartRate != null ? `${snapshot.heartRate} bpm` : '-'} />
                  <HealthValue label="Oxigenação no sangue" value={snapshot.oxygenSaturation != null ? `${snapshot.oxygenSaturation}%` : '-'} />
                  <HealthValue label="Passos hoje" value={snapshot.steps != null ? snapshot.steps.toLocaleString('pt-BR') : '-'} />
                </View>
              ) : (
                <Text className="font-body text-neutral-700 dark:text-theme-dark-text-secondary">
                  Ative a coleta para ver seus dados aqui.
                </Text>
              )}
            </Card>
          </View>
        )}
        {!enabled && isAndroid && (
          <View>
            <Card title="Como funciona" subtitle="Coleta automática dos dados do seu smartwatch">
              <View className="gap-3">
                <Text className="text-justify font-body text-[15px] leading-6 text-neutral-700 dark:text-theme-dark-text-secondary">
                  1. Toque em <Text className="font-bold">Ligar</Text> e permita o acesso aos dados de saúde e notificações;
                </Text>
                <Text className="text-justify font-body text-[15px] leading-6 text-neutral-700 dark:text-theme-dark-text-secondary">
                  2. O app lê frequência cardíaca, oxigenação do sangue e passos a cada hora, em segundo plano. Mantenha o relógio sincronizado com o app de saúde do celular;
                </Text>
                <Text className="text-justify font-body text-[15px] leading-6 text-neutral-700 dark:text-theme-dark-text-secondary">
                  3. Os últimos dados coletados aparecem aqui e você pode desligar quando quiser.
                </Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      <Modal
        transparent
        statusBarTranslucent
        animationType="fade"
        visible={confirmVisible}
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 p-8">
          <View className="w-full max-w-[420px]">
            <Card
              title="Parar a coleta automática?"
              subtitle="O app deixará de ler e enviar seus dados de saúde em segundo plano."
            >
              <View className="gap-2">
                <Button fullWidth variant="destructive" onPress={handleConfirmStop}>
                  Parar coleta
                </Button>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setConfirmVisible(false)}
                  className="items-center py-3"
                >
                  <Text className="font-body text-[15px] font-semibold text-neutral-900 dark:text-theme-dark-text-primary">
                    Continuar coletando
                  </Text>
                </Pressable>
              </View>
            </Card>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

type MonitoringButtonProps = {
  running: boolean;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
};

function MonitoringButton({ running, busy, disabled, onPress }: MonitoringButtonProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  const label = busy ? (running ? 'Desligando...' : 'Ligando...') : running ? 'Desligar' : 'Ligar';

  // Pulso suave: só enquanto a coleta está em execução.
  useEffect(() => {
    if (!running) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [running, pulse]);

  return (
    <View className="h-[200px] w-[200px] items-center justify-center">
      {running ? (
        <Animated.View
          pointerEvents="none"
          className="absolute h-[132px] w-[132px] rounded-full bg-[#16A34A]"
          // Valores animados não têm equivalente em classe: ficam em style.
          style={{
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
          }}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={running ? 'Desligar coleta automática do smartwatch' : 'Ligar coleta automática do smartwatch'}
        accessibilityState={{ disabled, busy }}
        disabled={disabled}
        onPress={onPress}
        className={`h-[132px] w-[132px] items-center justify-center gap-1.5 rounded-full border-[2px] ${running ? 'border-[#16A34A] bg-[#16A34A] shadow-lg' : 'border-[#6B7280] bg-transparent'
          } ${disabled && !busy ? 'opacity-50' : 'active:opacity-80'}`}
      >
        {busy ? (
          <ActivityIndicator size="large" color={running ? '#FFFFFF' : GRAY} />
        ) : (
          <MaterialCommunityIcons name="watch" size={48} color={running ? '#FFFFFF' : GRAY} />
        )}
        <Text
          className={`font-display text-[15px] font-bold ${running ? 'text-white' : 'text-[#6B7280]'}`}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function formatCollectedAt(iso: string | null): string | null {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HealthValue({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-150 pb-3 dark:border-theme-dark-border">
      <Text className="font-body text-[15px] text-neutral-700 dark:text-theme-dark-text-secondary">{label}</Text>
      <Text className="font-data text-[15px] font-bold text-neutral-900 dark:text-theme-dark-text-primary">{value}</Text>
    </View>
  );
}
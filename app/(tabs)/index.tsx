import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertCard } from '@/components/home/alert-card';
import { CheckinCard } from '@/components/home/checkin-card';
import { HomeErrorCard, NoProcedureCard } from '@/components/home/home-messages';
import { HomeSkeleton } from '@/components/home/home-skeleton';
import { NotWellButton } from '@/components/home/not-well-button';
import { ProgressCard } from '@/components/home/progress-card';
import { Screen } from '@/components/ui';
import {
    describeHomeError,
    fetchPatientAlerts,
    fetchPatientFirstName,
    fetchPatientProcedures,
    isOpenAlert,
    selectCurrentProcedure,
} from '@/src/application/patient-home-api';
import type { PatientAlert } from '@/src/domain/alert';
import type { PatientProcedureSummaryResponse } from '@/src/domain/patient-procedure';

/** A tela de check-in existe em app/checkin.tsx, então o botão fica habilitado. */
const CHECKIN_ROUTE = '/checkin';
/** Só mostramos o esqueleto se a resposta demorar mais que isto. */
const SKELETON_DELAY_MS = 300;
/** Folga entre o rodapé e a barra de abas, para o botão não encostar nela. */
const FOOTER_GAP = 12;

type LoadPhase = 'loading' | 'ready' | 'error';

export default function Home() {
  const [phase, setPhase] = useState<LoadPhase>('loading');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [procedure, setProcedure] = useState<PatientProcedureSummaryResponse | null>(null);
  const [openAlert, setOpenAlert] = useState<PatientAlert | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const mounted = useRef(true);

  const insets = useSafeAreaInsets();
  /**
   * No Android as NativeTabs envolvem o conteúdo num SafeAreaView com
   * `edges={{ bottom: true }}` (node_modules/expo-router/build/native-tabs/
   * NativeTabsView.android.js:36-43), então o inset inferior já foi aplicado
   * pelo pai e repeti-lo empurraria o botão para cima sem necessidade. No iOS
   * o conteúdo recebe apenas um SafeAreaProvider
   * (NativeTabsView.ios.js:71), sem padding, por isso aplicamos o inset aqui.
   */
  const bottomInset = Platform.OS === 'android' ? 0 : insets.bottom;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setPhase('loading');
    setShowSkeleton(false);
    const skeletonTimer = setTimeout(() => {
      if (mounted.current) setShowSkeleton(true);
    }, SKELETON_DELAY_MS);

    // Nome e alertas são acessórios: falha neles não derruba a tela.
    void fetchPatientFirstName().then((name) => {
      if (mounted.current) setFirstName(name);
    });
    void fetchPatientAlerts()
      .then((alerts) => {
        if (mounted.current) setOpenAlert(alerts.find(isOpenAlert) ?? null);
      })
      .catch((error: unknown) => {
        // Falha de alerta não derruba a tela, mas precisa deixar rastro.
        console.error('[home] falha ao carregar alertas:', error);
        if (mounted.current) setOpenAlert(null);
      });

    try {
      const procedures = await fetchPatientProcedures();
      if (!mounted.current) return;
      setProcedure(selectCurrentProcedure(procedures));
      setPhase('ready');
    } catch (error) {
      // Log permanente: `describeHomeError` reduz tudo a uma mensagem amigável,
      // então sem isto a causa real da falha não aparece em lugar nenhum.
      console.error('[home] falha ao carregar os procedimentos do paciente:', error);

      if (!mounted.current) return;
      setErrorMessage(describeHomeError(error));
      setPhase('error');
    } finally {
      clearTimeout(skeletonTimer);
      if (mounted.current) setShowSkeleton(false);
    }
  }, []);

  useEffect(() => {
    // Mesmo padrão de app/(tabs)/notificacoes.tsx: a carga sai do corpo do
    // efeito para não disparar setState sincronamente durante a renderização.
    const loadTimer = setTimeout(() => void load(), 0);
    return () => clearTimeout(loadTimer);
  }, [load]);

  const loading = phase === 'loading';

  return (
    <Screen className="bg-neutral-100 dark:bg-theme-dark-background">
      {/* O ScrollView e o rodapé são irmãos num container flex: o rodapé ocupa
          seu próprio espaço e nunca cobre o conteúdo rolável. */}
      <ScrollView contentContainerClassName="flex-grow gap-6 p-6 pb-4" showsVerticalScrollIndicator={false}>
        {loading && showSkeleton ? <HomeSkeleton /> : null}

        {loading ? null : (
          <>
            <Text
              allowFontScaling
              className="font-display text-[30px] font-extrabold leading-[38px] text-neutral-900 dark:text-theme-dark-text-primary"
            >
              {firstName ? `Olá, ${firstName}` : 'Olá'}
            </Text>

            {phase === 'error' ? (
              <HomeErrorCard message={errorMessage} onRetry={() => void load()} />
            ) : procedure ? (
              <>
                <ProgressCard
                  doctorName={procedure.doctor.fullName}
                  endDate={procedure.endDate}
                  procedureTitle={procedure.procedure.title}
                  startDate={procedure.startDate}
                />
                <CheckinCard
                  available
                  onPress={() =>
                    router.push({ pathname: CHECKIN_ROUTE, params: { patientProcedureId: procedure.id } })
                  }
                />
                {openAlert ? <AlertCard alert={openAlert} /> : null}
              </>
            ) : (
              <NoProcedureCard />
            )}
          </>
        )}
      </ScrollView>

      <View
        className="border-t border-neutral-150 bg-neutral-100 px-6 pt-4 dark:border-theme-dark-border dark:bg-theme-dark-background"
        // Espaço inferior vem do inset real do aparelho, não de um valor fixo.
        style={{ paddingBottom: bottomInset + FOOTER_GAP }}
      >
        <NotWellButton onPress={() => router.push('/orientacoes-nao-estou-bem')} />
      </View>
    </Screen>
  );
}

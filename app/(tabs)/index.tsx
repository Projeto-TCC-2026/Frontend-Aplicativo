import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { CheckinCard } from '@/components/home/checkin-card';
import { HomeErrorCard, NoProcedureCard } from '@/components/home/home-messages';
import { HomeSkeleton } from '@/components/home/home-skeleton';
import { HomeWeeklyMetrics } from '@/components/home/home-weekly-metrics';
import { ProgressCard } from '@/components/home/progress-card';
import { Screen } from '@/components/ui';
import {
  describeHomeError,
  fetchPatientAlerts,
  fetchPatientFirstName,
  fetchPatientHomeMetrics,
  fetchPatientProcedures,
  getLastSevenDaysRange,
  isOpenAlert,
  selectCurrentProcedure,
} from '@/src/application/patient-home-api';
import type { PatientAlert } from '@/src/domain/alert';
import type { PatientHomeMetrics } from '@/src/domain/patient-home-metrics';
import type { PatientProcedureSummaryResponse } from '@/src/domain/patient-procedure';

/** A tela de check-in existe em app/checkin.tsx. */
const CHECKIN_ROUTE = '/checkin';

type LoadPhase = 'loading' | 'ready' | 'error';

export default function Home() {
  const [phase, setPhase] = useState<LoadPhase>('loading');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [procedure, setProcedure] = useState<PatientProcedureSummaryResponse | null>(null);
  const [homeMetrics, setHomeMetrics] = useState<PatientHomeMetrics | null>(null);
  const [openAlert, setOpenAlert] = useState<PatientAlert | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const mounted = useRef(true);
  const loadRequestId = useRef(0);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    const initialLoad = !hasLoadedRef.current;

    if (initialLoad) {
      setPhase('loading');
      setShowSkeleton(true);
    }

    // Nome e alertas são acessórios: falha neles não derruba a tela.
    void fetchPatientFirstName().then((name) => {
      if (mounted.current && requestId === loadRequestId.current) setFirstName(name);
    });
    void fetchPatientAlerts()
      .then((alerts) => {
        if (mounted.current && requestId === loadRequestId.current) setOpenAlert(alerts.find(isOpenAlert) ?? null);
      })
      .catch((error: unknown) => {
        // Falha de alerta não derruba a tela, mas precisa deixar rastro.
        console.error('[home] falha ao carregar alertas:', error);
        if (mounted.current && requestId === loadRequestId.current) setOpenAlert(null);
      });

    try {
      const procedures = await fetchPatientProcedures();
      if (!mounted.current || requestId !== loadRequestId.current) return;
      const currentProcedure = selectCurrentProcedure(procedures);
      setProcedure(currentProcedure);
      if (currentProcedure) {
        const { startDate, endDate } = getLastSevenDaysRange();
        const metrics = await fetchPatientHomeMetrics(currentProcedure.id, startDate, endDate);
        if (!mounted.current || requestId !== loadRequestId.current) return;
        setHomeMetrics(metrics);
      } else {
        setHomeMetrics(null);
      }
      hasLoadedRef.current = true;
      setPhase('ready');
    } catch (error) {
      // Log permanente: `describeHomeError` reduz tudo a uma mensagem amigável,
      // então sem isto a causa real da falha não aparece em lugar nenhum.
      console.error('[home] falha ao carregar o acompanhamento ou suas métricas:', error);

      if (!mounted.current || requestId !== loadRequestId.current) return;
      setErrorMessage(describeHomeError(error));
      hasLoadedRef.current = true;
      setPhase('error');
    } finally {
      if (mounted.current && requestId === loadRequestId.current) setShowSkeleton(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    const loadTimer = setTimeout(() => void load(), 0);
    return () => clearTimeout(loadTimer);
  }, [load]));

  const loading = phase === 'loading';

  return (
    <Screen className="bg-neutral-100 dark:bg-theme-dark-background">
      <ScrollView contentContainerClassName="flex-grow gap-4 pt-10 pb-8 px-6" showsVerticalScrollIndicator={false}>
        {loading && showSkeleton ? <HomeSkeleton /> : null}

        {loading ? null : (
          <>
            <Text
              allowFontScaling
              className="font-display text-[30px] font-extrabold leading-[38px] text-neutral-900 dark:text-theme-dark-text-primary"
            >
              {firstName ? `Olá, ${firstName}!` : 'Olá!'}
            </Text>
            <Text className="-mt-4 font-body text-sm text-neutral-700 dark:text-theme-dark-text-secondary">
              Acompanhe seu cuidado, um dia de cada vez.
            </Text>

            {phase === 'error' ? (
              <HomeErrorCard message={errorMessage} onRetry={() => void load()} />
            ) : procedure ? (
              <>
                <CheckinCard
                  available={homeMetrics !== null && !homeMetrics.submittedToday}
                  submittedToday={homeMetrics?.submittedToday ?? false}
                  onPress={() =>
                    router.push({ pathname: CHECKIN_ROUTE, params: { patientProcedureId: procedure.id } })
                  }
                  onHelpPress={() => router.push('/orientacoes-nao-estou-bem')}
                />
                <ProgressCard
                  doctorName={procedure.doctor.fullName}
                  endDate={procedure.endDate}
                  procedureTitle={procedure.procedure.title}
                  startDate={procedure.startDate}
                />
                {homeMetrics ? <HomeWeeklyMetrics metrics={homeMetrics} /> : null}
              </>
            ) : (
              <NoProcedureCard />
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

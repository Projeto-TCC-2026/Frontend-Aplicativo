import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, ErrorState, Screen } from '@/components/ui';
import { DynamicFieldRenderer, type DynamicFieldValue } from '@/components/dynamic-field-renderer';
import type { AggregatedCheckinResponse, CheckinForm, DynamicField } from '@/src/domain/checkin';
import { createApiClient } from '@/src/infrastructure/api/api-config';
import { ApiClientError } from '@/src/infrastructure/api/api-client';
import { secureTokenStore } from '@/src/infrastructure/api/secure-token-store';
import { markCheckinCompleted } from '@/src/infrastructure/api/daily-checkin-store';
import { notify } from '@/src/shared/notify';
import { colors } from '@/constants/design-tokens';

type FieldState = Record<string, DynamicFieldValue>;
type FieldErrorState = Record<string, string>;

export default function Checkin() {
  const params = useLocalSearchParams<{ patientProcedureId?: string | string[] }>();
  const [forms, setForms] = useState<CheckinForm[]>([]);
  const [values, setValues] = useState<FieldState>({});
  const [errors, setErrors] = useState<FieldErrorState>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<AggregatedCheckinResponse | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const procedureIds = useMemo(() => getProcedureIds(params.patientProcedureId), [params.patientProcedureId]);

  useFocusEffect(useCallback(() => {
    notify.dismiss();
  }, []));

  useEffect(() => {
    let active = true;

    void secureTokenStore.getAccessToken().then((token) => {
      if (!active) return; if (!token) {
        router.replace('/login');
        return;
      } setSessionReady(true);
    });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    let active = true;

    async function loadForms() {
      if (!procedureIds.length) {
        setLoading(false);
        setErrorMessage('Informe um patientProcedureId para carregar o check-in.');
        return;
      }

      try {
        const client = createApiClient();
        setForms(await Promise.all(procedureIds.map((id) => client.getCheckinForm(id))));
        setErrorMessage(null);

      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error));
          if (error instanceof ApiClientError && error.status === 401) {
            await secureTokenStore.clear(); router.replace('/login');
          }
        }
      } finally {
        if (active)
          setLoading(false);
      }
    }

    void loadForms();
    return () => {
      active = false;
    };
  }, [procedureIds, sessionReady]);

  function updateField(field: DynamicField, value: DynamicFieldValue) {
    setValues((current) => ({ ...current, [field.id]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field.id];
      return next;
    });
    setSuccess(null);
  }

  async function pickPhoto(field: DynamicField) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify.warning('Permita o acesso às fotos para adicionar uma imagem.', 'Acesso às fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) updateField(field, result.assets[0].uri);
  }

  async function submit() {
    const nextErrors = validateForms(forms, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      notify.error('Preencha os campos obrigatórios antes de enviar.', 'Campos pendentes');
      return;
    }

    setSubmitting(true);

    try {
      const response = await createApiClient().submitAggregatedCheckin({
        patientProcedureIds: forms.map((form) => form.patientProcedureId),
        idempotencyKey: `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fields: forms.flatMap((form) => form.fields).map((field) => ({
          fieldId: field.id,
          value: field.dataType === 'PHOTO' ? null : values[field.id],
          photoUrl: field.dataType === 'PHOTO' ? values[field.id] : null
        }))
      });

      await markCheckinCompleted();
      setSuccess(response);
    } catch (error) {
      notify.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    if (router.canGoBack())
      router.back();
    else
      router.replace('/' as never);
  }

  if (loading || !sessionReady) return <LoadingState />;

  if (success) return <SuccessState editableUntil={success.editableUntil} />;

  if (!forms.length) return <EmptyState errorMessage={errorMessage} onBack={goBack} />;

  return (
    <Screen className="bg-neutral-100 pb-10 dark:bg-theme-dark-background">
      <ScrollView contentContainerClassName="flex-grow p-5 pb-10 gap-3" keyboardShouldPersistTaps="handled">
        <CheckinHeader onBack={goBack} />

        {forms.map((form) => <CheckinFormCard key={form.patientProcedureId} form={form} values={values} errors={errors} submitting={submitting} onFieldChange={updateField} onPickPhoto={pickPhoto} />)}

        <Button fullWidth loading={submitting} loadingText="Enviando..." onPress={() => void submit()}>Enviar check-in</Button>
      </ScrollView>
    </Screen>
  );
}

function LoadingState() {
  return <Screen className="items-center justify-center bg-neutral-100 dark:bg-theme-dark-background"><ActivityIndicator color={colors.primary} size="large" /></Screen>;
}

function SuccessState({ editableUntil }: { editableUntil: string }) {
  return (
    <Screen className="items-center justify-center gap-3 bg-neutral-100 p-6 dark:bg-theme-dark-background">
      <Text className="font-display text-[26px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">Check-in enviado</Text>
      <Text className="font-body text-[15px] text-neutral-700 dark:text-theme-dark-text-secondary">Seus dados foram recebidos e serão avaliados pelo Backend.</Text>
      <Text className="font-body text-[13px] text-neutral-500 dark:text-theme-dark-text-tertiary">Editável até {new Date(editableUntil).toLocaleString('pt-BR')}</Text>
      <Button variant="secondary" onPress={() => router.replace('/' as never)}>Voltar para a Home</Button>
    </Screen>
  );
}

function EmptyState({ errorMessage, onBack }: { errorMessage: string | null; onBack: () => void }) {
  return (
    <Screen className="items-center justify-center bg-neutral-100 p-6 dark:bg-theme-dark-background">
      <BackButton onPress={onBack} />
      <ErrorState title="Não foi possível carregar o check-in" description={errorMessage ?? 'Tente novamente em alguns instantes.'} />
    </Screen>
  );
}

function CheckinHeader({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Text className="mb-1.5 mt-3 font-display text-[30px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary"><BackButton onPress={onBack} /> Check-in diário</Text>
      <Text className="font-body text-[15px] leading-[22px] text-neutral-700 dark:text-theme-dark-text-secondary">Preencha os dados definidos pelo seu profissional de saúde.</Text>
    </>
  );
}

function CheckinFormCard({ form, values, errors, submitting, onFieldChange, onPickPhoto }: { form: CheckinForm; values: FieldState; errors: FieldErrorState; submitting: boolean; onFieldChange: (field: DynamicField, value: DynamicFieldValue) => void; onPickPhoto: (field: DynamicField) => void }) {
  return (
    <View className="mt-5 rounded-[14px] border border-neutral-150 bg-white p-4 dark:border-theme-dark-border dark:bg-theme-dark-surface">
      {form.procedure.description ? <Text className="font-body text-[13px] text-neutral-500 dark:text-theme-dark-text-tertiary">{form.procedure.description}</Text> : null}
      {form.fields.map((field) => <DynamicFieldRenderer key={field.id} field={field} value={values[field.id] ?? null} error={errors[field.id]} disabled={submitting} onChange={(value) => onFieldChange(field, value)} onPickPhoto={() => onPickPhoto(field)} onRemovePhoto={() => onFieldChange(field, null)} renderPhotoPreview={(photoUrl) => <Image accessibilityLabel={`Foto selecionada para ${field.name}`} source={{ uri: photoUrl }} className="mt-3 h-48 w-full rounded-[10px]" resizeMode="cover" />} />)}
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.darkTextPrimary : colors.neutral900;
  return <Pressable accessibilityLabel="Voltar" accessibilityRole="button" className="mb-2 h-11 w-11 items-center justify-center self-start rounded-full" hitSlop={8} onPress={onPress}><Ionicons color={iconColor} name="arrow-back" size={24} /></Pressable>;
}

function getProcedureIds(parameter: string | string[] | undefined): string[] {
  const raw = parameter ?? process.env.EXPO_PUBLIC_PATIENT_PROCEDURE_ID ?? '';
  return (Array.isArray(raw) ? raw : raw.split(',')).map((id) => id.trim()).filter(Boolean);
}

function validateForms(forms: CheckinForm[], values: FieldState): FieldErrorState {
  const errors: FieldErrorState = {};
  for (const field of forms.flatMap((form) => form.fields)) {
    if (field.required && !values[field.id]?.trim()) errors[field.id] = 'Este campo é obrigatório.';
  }
  return errors;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'Sua sessão expirou. Faça login novamente.';
    if (error.status === 403) return 'Você não tem acesso a este acompanhamento.';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Não foi possível carregar o check-in.';
}

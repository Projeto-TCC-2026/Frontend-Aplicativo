import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DynamicFieldRenderer, type DynamicFieldValue } from '@/components/dynamic-field-renderer';
import type { AggregatedCheckinResponse, CheckinForm, DynamicField } from '@/src/domain/checkin';
import { createApiClient } from '@/src/infrastructure/api/api-config';
import { ApiClientError } from '@/src/infrastructure/api/api-client';
import { secureTokenStore } from '@/src/infrastructure/api/secure-token-store';

const colors = {
  primary: '#0C4C8A',
  title: '#142230',
  body: '#445468',
  secondary: '#7C8DA1',
  border: '#E4E9ED',
  background: '#EEF2F5',
  white: '#FFFFFF',
  danger: '#D9484B',
};

type FieldState = Record<string, DynamicFieldValue>;
type ErrorState = Record<string, string>;

export default function Index() {
  const params = useLocalSearchParams<{ patientProcedureId?: string | string[] }>();
  const [forms, setForms] = useState<CheckinForm[]>([]);
  const [values, setValues] = useState<FieldState>({});
  const [errors, setErrors] = useState<ErrorState>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<AggregatedCheckinResponse | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const procedureIds = getProcedureIds(params.patientProcedureId);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const accessToken = await secureTokenStore.getAccessToken();
      if (!active) return;
      if (!accessToken) {
        router.replace('/login');
        return;
      }
      setSessionReady(true);
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    let active = true;

    async function loadForms() {
      if (procedureIds.length === 0) {
        setLoading(false);
        setErrorMessage('Informe um patientProcedureId para carregar o check-in.');
        return;
      }

      try {
        const client = createApiClient();
        const loadedForms = await Promise.all(procedureIds.map((id) => client.getCheckinForm(id)));
        if (!active) return;
        setForms(loadedForms);
        setErrorMessage(null);
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error));
          if (error instanceof ApiClientError && error.status === 401) {
            await secureTokenStore.clear();
            router.replace('/login');
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadForms();
    return () => {
      active = false;
    };
  }, [procedureIds.join(','), sessionReady]);

  function updateField(field: DynamicField, value: DynamicFieldValue) {
    setValues((current) => ({ ...current, [field.id]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field.id];
      return next;
    });
    setSuccess(null);
  }

  async function submit() {
    const nextErrors = validateForms(forms, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setErrorMessage('Preencha os campos obrigatórios antes de enviar.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const client = createApiClient();
      const response = await client.submitAggregatedCheckin({
        patientProcedureIds: forms.map((form) => form.patientProcedureId),
        idempotencyKey: createIdempotencyKey(),
        fields: forms.flatMap((form) => form.fields).map((field) => ({
          fieldId: field.id,
          value: field.dataType === 'PHOTO' ? null : values[field.id],
          photoUrl: field.dataType === 'PHOTO' ? values[field.id] : null,
        })),
      });
      setSuccess(response);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <CenteredState><ActivityIndicator color={colors.primary} size="large" /></CenteredState>;
  }

  if (success) {
    return (
      <CenteredState>
        <Text style={styles.successTitle}>Check-in enviado</Text>
        <Text style={styles.body}>Seus dados foram recebidos e serão avaliados pelo Backend.</Text>
        <Text style={styles.caption}>Editável até {formatDate(success.editableUntil)}</Text>
        <Pressable onPress={() => setSuccess(null)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Voltar ao formulário</Text>
        </Pressable>
      </CenteredState>
    );
  }

  if (forms.length === 0) {
    return <CenteredState><Text style={styles.error}>{errorMessage}</Text></CenteredState>;
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Check-in diário</Text>
      <Text style={styles.body}>Preencha os dados definidos pelo seu profissional de saúde.</Text>
      {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}

      {forms.map((form) => (
        <View key={form.patientProcedureId} style={styles.procedureSection}>
          <Text style={styles.procedureTitle}>{form.procedure.title ?? 'Acompanhamento'}</Text>
          {form.procedure.description ? <Text style={styles.caption}>{form.procedure.description}</Text> : null}
          {form.fields.map((field) => (
            <DynamicFieldRenderer
              key={field.id}
              field={field}
              value={values[field.id] ?? null}
              error={errors[field.id]}
              disabled={submitting}
              onChange={(value) => updateField(field, value)}
              onPickPhoto={() => Alert.alert('Foto', 'A seleção de fotos será habilitada nesta etapa.')}
            />
          ))}
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        disabled={submitting}
        onPress={() => void submit()}
        style={[styles.submitButton, submitting && styles.disabledButton]}>
        {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitButtonText}>Enviar check-in</Text>}
      </Pressable>
    </ScrollView>
  );
}

function CenteredState({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

function getProcedureIds(parameter: string | string[] | undefined): string[] {
  const raw = parameter ?? process.env.EXPO_PUBLIC_PATIENT_PROCEDURE_ID ?? '';
  return (Array.isArray(raw) ? raw : raw.split(',')).map((id) => id.trim()).filter(Boolean);
}

function validateForms(forms: CheckinForm[], values: FieldState): ErrorState {
  const errors: ErrorState = {};
  for (const field of forms.flatMap((form) => form.fields)) {
    if (field.required && !values[field.id]?.trim()) errors[field.id] = 'Este campo é obrigatório.';
  }
  return errors;
}

function createIdempotencyKey(): string {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

function formatDate(value: string): string {
  return new Date(value).toLocaleString('pt-BR');
}

const styles = StyleSheet.create({
  content: { backgroundColor: colors.background, flexGrow: 1, padding: 20, paddingBottom: 40 },
  centered: { alignItems: 'center', backgroundColor: colors.background, flex: 1, gap: 12, justifyContent: 'center', padding: 24 },
  title: { color: colors.title, fontSize: 30, fontWeight: '800', marginBottom: 6 },
  procedureSection: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: 14, borderWidth: 1, marginTop: 20, padding: 16 },
  procedureTitle: { color: colors.title, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  body: { color: colors.body, fontSize: 15, lineHeight: 22 },
  caption: { color: colors.secondary, fontSize: 13, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: 14 },
  successTitle: { color: colors.title, fontSize: 26, fontWeight: '800' },
  submitButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 9, justifyContent: 'center', marginTop: 22, minHeight: 52 },
  submitButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  secondaryButton: { borderColor: colors.primary, borderRadius: 9, borderWidth: 1, marginTop: 12, paddingHorizontal: 16, paddingVertical: 13 },
  secondaryButtonText: { color: colors.primary, fontWeight: '700' },
  disabledButton: { opacity: 0.7 },
});

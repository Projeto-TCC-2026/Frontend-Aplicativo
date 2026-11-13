import type { AggregatedCheckinRequest, CheckinForm } from '@/src/domain/checkin';

export type CheckinFieldValues = Record<string, string | null | undefined>;
export type CheckinFieldErrors = Record<string, string>;
export type CheckinErrorAction = 'load' | 'submit';

export function buildAggregatedCheckinRequest(
  forms: CheckinForm[],
  values: CheckinFieldValues,
  idempotencyKey: string,
): AggregatedCheckinRequest {
  return {
    patientProcedureIds: forms.map((form) => form.patientProcedureId),
    idempotencyKey,
    fields: forms.flatMap((form) => form.fields).flatMap((field) => {
      if (field.dataType === 'PHOTO') return [];
      const rawValue = values[field.id]?.trim();
      const value = field.dataType === 'DECIMAL' ? rawValue?.replace(',', '.') : rawValue;
      return value ? [{ fieldId: field.id, value }] : [];
    }),
  };
}

export function validateCheckinForms(
  forms: CheckinForm[],
  values: CheckinFieldValues,
): CheckinFieldErrors {
  const errors: CheckinFieldErrors = {};
  for (const field of forms.flatMap((form) => form.fields)) {
    const value = values[field.id]?.trim();
    if (!value) {
      if (field.required) errors[field.id] = 'Este campo é obrigatório.';
      continue;
    }

    if (field.dataType === 'INTEGER' && !/^[+-]?\d+$/.test(value)) {
      errors[field.id] = 'Informe um número inteiro.';
      continue;
    }
    if (field.dataType === 'DECIMAL' && !/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value)) {
      errors[field.id] = 'Informe um número válido.';
      continue;
    }
    if (field.dataType === 'BOOLEAN' && value !== 'true' && value !== 'false') {
      errors[field.id] = 'Selecione sim ou não.';
      continue;
    }

    if (['INTEGER', 'DECIMAL', 'SCALE'].includes(field.dataType)) {
      const numericValue = Number(value.replace(',', '.'));
      if (field.minValue != null && numericValue < field.minValue) {
        errors[field.id] = `O valor mínimo é ${field.minValue}.`;
      } else if (field.maxValue != null && numericValue > field.maxValue) {
        errors[field.id] = `O valor máximo é ${field.maxValue}.`;
      }
    }
  }
  return errors;
}

export function hasSelectedPhotoField(
  forms: CheckinForm[],
  values: CheckinFieldValues,
): boolean {
  return forms.some((form) => form.fields.some(
    (field) => field.dataType === 'PHOTO' && Boolean(values[field.id]?.trim()),
  ));
}

export function getCheckinErrorMessage(
  error: unknown,
  action: CheckinErrorAction,
): string {
  const status = getErrorStatus(error);
  if (status === 401) return 'Sua sessão expirou. Faça login novamente.';
  if (status === 403) return 'Não foi possível acessar este acompanhamento.';
  if (status === 409) return 'O relatório de hoje já foi enviado.';
  if (status === 400 && action === 'submit') {
    return 'Confira as respostas e tente enviar novamente.';
  }
  return action === 'load'
    ? 'Não foi possível carregar o formulário. Verifique sua conexão e tente novamente.'
    : 'Não foi possível enviar seu relatório agora. Tente novamente em alguns instantes.';
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') {
    return error.status;
  }
  return undefined;
}

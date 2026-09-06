export type FieldDataType = 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'TEXT' | 'SCALE' | 'PHOTO';

export type ProcedureSummary = {
  id?: string;
  title?: string;
  description?: string | null;
};

export type DynamicField = {
  id: string;
  name: string;
  description?: string | null;
  unit?: string | null;
  dataType: FieldDataType;
  metricKey?: string | null;
  required: boolean;
  displayOrder: number;
  minValue?: number | null;
  maxValue?: number | null;
  normalBoolean?: boolean | null;
};

export type CheckinForm = {
  patientProcedureId: string;
  procedure: ProcedureSummary;
  fields: DynamicField[];
};

export type CheckinFieldValue = {
  fieldId: string;
  value?: string | null;
  photoUrl?: string | null;
};

export type AggregatedCheckinRequest = {
  patientProcedureIds: string[];
  idempotencyKey: string;
  configurationVersion?: string | null;
  fields: CheckinFieldValue[];
};

export type AggregatedCheckinResponse = {
  submissionId: string;
  checkinIds: string[];
  submittedAt: string;
  editableUntil: string;
};

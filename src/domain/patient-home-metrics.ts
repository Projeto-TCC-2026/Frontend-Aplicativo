import type { FieldDataType } from './checkin';

export type DailyCheckinStatus = {
  date: string;
  submitted: boolean;
};

export type PatientFieldTrend = {
  fieldId: string;
  name: string;
  dataType: Extract<FieldDataType, 'INTEGER' | 'DECIMAL' | 'SCALE'>;
  unit: string | null;
  dailyAverages: {
    date: string;
    average: number | null;
    sampleSize: number;
  }[];
};

export type PatientHomeMetrics = {
  patientProcedureId: string;
  procedureTitle: string;
  startDate: string;
  submittedToday: boolean;
  dailyCheckins: DailyCheckinStatus[];
  numericFields: PatientFieldTrend[];
};

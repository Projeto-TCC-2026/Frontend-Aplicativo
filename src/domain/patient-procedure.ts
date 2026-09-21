/**
 * Tipos do resumo de procedimento do paciente usado pela Home.
 * O envelope `{ success, data, message }` é o `ApiResponse` de
 * `src/shared/types/api.ts`, aplicado na camada de chamada.
 */

export type PatientProcedureProcedure = {
  id: string;
  title: string;
  estimatedDuration: number;
};

export type PatientProcedureDoctor = {
  id: string;
  fullName: string;
  crm: string;
  specialty: string;
};

export type PatientProcedureSummaryResponse = {
  id: string;
  procedure: PatientProcedureProcedure;
  doctor: PatientProcedureDoctor;
  startDate: string;
  /** Nulo em acompanhamentos sem data de término prevista. */
  endDate: string | null;
  status: string;
};

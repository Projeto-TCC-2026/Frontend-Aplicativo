export type PatientAlert = {
  id: string;
  severity: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: string;
};

export type PaginatedAlerts = {
  content: PatientAlert[];
  totalPages: number;
  totalElements: number;
  number: number;
  last: boolean;
};

import type {
  AggregatedCheckinRequest,
  AggregatedCheckinResponse,
  CheckinForm,
} from '@/src/domain/checkin';
import type { ApiClient } from '@/src/infrastructure/api/api-client';

export type CheckinApi = {
  getForm(patientProcedureId: string): Promise<CheckinForm>;
  submitAggregated(request: AggregatedCheckinRequest): Promise<AggregatedCheckinResponse>;
};

export class HttpCheckinApi implements CheckinApi {
  constructor(private readonly client: ApiClient) {}

  getForm(patientProcedureId: string): Promise<CheckinForm> {
    return this.client.getCheckinForm(patientProcedureId);
  }

  submitAggregated(request: AggregatedCheckinRequest): Promise<AggregatedCheckinResponse> {
    return this.client.submitAggregatedCheckin(request);
  }
}

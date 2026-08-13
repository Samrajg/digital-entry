import { apiClient } from './apiClient';

export interface Gate {
  gate_id: number;
  campus_id: number;
  name: string;
  code: string;
  description?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QRCodeShort {
  qr_code_id: number;
  code: string;
  name: string;
  is_active: boolean;
}

export interface GateDetail extends Gate {
  campus_name: string;
  qr_codes: QRCodeShort[];
}

export interface GateCreateInput {
  name: string;
  code: string;
  description?: string;
  location?: string;
}

export interface GateUpdateInput {
  name?: string;
  code?: string;
  description?: string;
  location?: string;
}

export const gateService = {
  async getGates(campusId: number): Promise<Gate[]> {
    const response = await apiClient.get<Gate[]>(`/api/campuses/${campusId}/gates`);
    return response.data;
  },

  async getAllGates(): Promise<GateDetail[]> {
    const response = await apiClient.get<GateDetail[]>('/api/gates');
    return response.data;
  },

  async getGateDetails(gateId: number): Promise<GateDetail> {
    const response = await apiClient.get<GateDetail>(`/api/gates/${gateId}`);
    return response.data;
  },

  async createGate(campusId: number, data: GateCreateInput): Promise<Gate> {
    const response = await apiClient.post<Gate>(`/api/campuses/${campusId}/gates`, data);
    return response.data;
  },

  async updateGate(gateId: number, data: GateUpdateInput): Promise<Gate> {
    const response = await apiClient.put<Gate>(`/api/gates/${gateId}`, data);
    return response.data;
  },

  async toggleGateStatus(gateId: number, isActive: boolean): Promise<Gate> {
    const response = await apiClient.patch<Gate>(`/api/gates/${gateId}/status`, {
      is_active: isActive,
    });
    return response.data;
  },
};

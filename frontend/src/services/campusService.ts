import { apiClient } from './apiClient';

export interface Campus {
  campus_id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GateShort {
  gate_id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface CampusDetail extends Campus {
  gates: GateShort[];
}

export interface CampusCreateInput {
  name: string;
  code: string;
  address?: string;
  city?: string;
}

export interface CampusUpdateInput {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
}

export const campusService = {
  async getCampuses(): Promise<Campus[]> {
    const response = await apiClient.get<Campus[]>('/api/campuses');
    return response.data;
  },

  async getCampusDetails(campusId: number): Promise<CampusDetail> {
    const response = await apiClient.get<CampusDetail>(`/api/campuses/${campusId}`);
    return response.data;
  },

  async createCampus(data: CampusCreateInput): Promise<Campus> {
    const response = await apiClient.post<Campus>('/api/campuses', data);
    return response.data;
  },

  async updateCampus(campusId: number, data: CampusUpdateInput): Promise<Campus> {
    const response = await apiClient.put<Campus>(`/api/campuses/${campusId}`, data);
    return response.data;
  },

  async toggleCampusStatus(campusId: number, isActive: boolean): Promise<Campus> {
    const response = await apiClient.patch<Campus>(`/api/campuses/${campusId}/status`, {
      is_active: isActive,
    });
    return response.data;
  },
};

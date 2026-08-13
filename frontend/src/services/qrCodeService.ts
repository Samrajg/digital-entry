import { apiClient } from './apiClient';

export interface QRCode {
  qr_code_id: number;
  gate_id: number;
  gate_name: string;
  campus_id: number;
  campus_name: string;
  code: string;
  name: string;
  destination_url: string;
  is_active: boolean;
  qr_image_base64?: string;
  created_at: string;
  updated_at: string;
}

export interface QRCodeCreate {
  qr_code_id: string;
  name: string;
  form_id: string;
}

export interface QRCodeUpdate {
  name?: string;
  form_id?: string;
}

export const qrCodeService = {
  async getQRCodes(gateId: number): Promise<QRCode[]> {
    const response = await apiClient.get<QRCode[]>(`/api/gates/${gateId}/qr-codes`);
    return response.data;
  },

  async getAllQRCodes(): Promise<QRCode[]> {
    const response = await apiClient.get<QRCode[]>('/api/qr-codes');
    return response.data;
  },

  async getQRCodeDetails(qrCodeId: number): Promise<QRCode> {
    const response = await apiClient.get<QRCode>(`/api/qr-codes/${qrCodeId}`);
    return response.data;
  },

  async createQRCode(gateId: number, data: QRCodeCreate): Promise<QRCode> {
    const response = await apiClient.post(`/api/gates/${gateId}/qr-codes`, data);
    return response.data;
  },

  async updateQRCode(qrCodeId: string, data: QRCodeUpdate): Promise<QRCode> {
    const response = await apiClient.put(`/api/qr-codes/${qrCodeId}`, data);
    return response.data;
  },

  async toggleQRCodeStatus(qrCodeId: number, isActive: boolean): Promise<QRCode> {
    const response = await apiClient.patch<QRCode>(`/api/qr-codes/${qrCodeId}/status`, {
      is_active: isActive,
    });
    return response.data;
  },
};

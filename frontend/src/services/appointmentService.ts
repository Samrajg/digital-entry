import { apiClient } from './apiClient';

export interface Appointment {
  appointment_id?: number;
  appointment_code?: string;
  visitor_name: string;
  visitor_email?: string;
  visitor_phone?: string;
  visitor_company?: string;
  appointment_date: string;
  time_slot_start?: string;
  time_slot_end?: string;
  purpose: string;
  qr_image_base64?: string;
  status?: string;
  created_at?: string;
}

export const appointmentService = {
  getAppointments: async (params?: Record<string, string | number | boolean>) => {
    const response = await apiClient.get('/api/appointments', { params });
    return response.data;
  },
  
  getAppointmentByCode: async (code: string) => {
    const response = await apiClient.get(`/api/public/appointment/${code}`);
    return response.data;
  },

  createAppointment: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/api/appointments', data);
    return response.data;
  },

  editAppointment: async (id: number, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/api/appointments/${id}`, data);
    return response.data;
  },

  cancelAppointment: async (id: number) => {
    const response = await apiClient.patch(`/api/appointments/${id}/cancel`);
    return response.data;
  },

  checkinAppointment: async (code: string, pin: string, gateId: number = 1) => {
    const response = await apiClient.post(`/api/public/appointment/${code}/checkin`, { 
      security_pin: pin,
      gate_id: gateId 
    });
    return response.data;
  }
};

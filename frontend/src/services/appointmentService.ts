import { apiClient } from './apiClient';

/**
 * BUG-23 FIX: Appointment interface now mirrors the backend AppointmentResponse schema exactly.
 * Removed: visitor_company (never existed in backend schema)
 * Added: campus_id, campus_name, meeting_location, department, employee_name, checked_in_at
 */
export interface Appointment {
  appointment_id?: number;
  appointment_code?: string;
  // Visitor details
  visitor_name: string;
  visitor_email?: string;
  visitor_phone?: string;
  visitor_count?: number;
  // Meeting details
  purpose: string;
  campus_id?: number;
  campus_name?: string;
  meeting_location?: string;
  department?: string;
  employee_name?: string;
  // Schedule
  appointment_date: string;
  time_slot_start?: string;
  time_slot_end?: string;
  // State
  status?: string;
  notes?: string;
  // QR / tracking
  qr_image_base64?: string;
  checked_in_at?: string | null;
  created_at?: string;
}

/** Fields that can be sent to PUT /api/appointments/{id} (all optional) */
export interface AppointmentUpdate {
  visitor_name?: string;
  visitor_email?: string;
  visitor_phone?: string;
  visitor_count?: number;
  purpose?: string;
  campus_id?: number;
  meeting_location?: string;
  department?: string;
  appointment_date?: string;
  time_slot_start?: string;
  time_slot_end?: string;
  notes?: string;
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

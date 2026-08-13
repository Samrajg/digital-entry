import { apiClient } from './apiClient';

export interface User {
  user_id: number;
  username: string;
  user_role: 'admin' | 'security' | 'supervisor' | 'manager';
}

export interface LoginResponse {
  message: string;
  user: User;
}

export const authService = {
  async login(username: string, userPin: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      username,
      user_pin: userPin,
    });
    return response.data;
  },
};

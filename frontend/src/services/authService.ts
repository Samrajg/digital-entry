import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const response = await api.post<LoginResponse>('/api/auth/login', {
      username,
      user_pin: userPin,
    });
    return response.data;
  },
};

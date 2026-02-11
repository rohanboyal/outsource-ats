// src/api/clients.ts
import api from './axios';
import type { Client } from '../types';

export interface CreateClientData {
  company_name: string;
  industry?: string;
  company_size?: string;
  website?: string;
  status?: 'active' | 'inactive' | 'on_hold';
  default_sla_days?: number;
  billing_address?: string;
  payment_terms?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export interface ClientsListResponse {
  clients: Client[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const clientsApi = {
  // Get all clients
  getClients: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
  }): Promise<ClientsListResponse> => {
    const response = await api.get<ClientsListResponse>('/clients', { params });
    return response.data;
  },

  // Get single client
  getClient: async (id: number): Promise<Client> => {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  // Create client
  createClient: async (data: CreateClientData): Promise<Client> => {
    const response = await api.post<Client>('/clients', data);
    return response.data;
  },

  // Update client
  updateClient: async (id: number, data: UpdateClientData): Promise<Client> => {
    const response = await api.put<Client>(`/clients/${id}`, data);
    return response.data;
  },

  // Delete client
  deleteClient: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};

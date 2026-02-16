// src/api/offers.ts - FINAL CORRECT VERSION
import api from './axios';
import type { Offer, OfferStatus } from '../types';

export interface CreateOfferData {
  application_id: number;
  designation: string;
  annual_ctc: number;
  base_salary?: number;
  variable_pay?: number;
  bonus?: number;
  benefits?: Record<string, any>;
  joining_date?: string;
  offer_valid_till?: string;
  work_location?: string;
  remarks?: string;
}

export interface UpdateOfferData extends Partial<CreateOfferData> {}

export interface OffersListResponse {
  offers: Offer[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const offersApi = {
  getOffers: async (params?: {
    page?: number;
    page_size?: number;
    application_id?: number;
    status?: string;
  }): Promise<OffersListResponse> => {
    const response = await api.get<OffersListResponse>('/offers', { params });
    return response.data;
  },

  getOffer: async (id: number): Promise<Offer> => {
    const response = await api.get<Offer>(`/offers/${id}`);
    return response.data;
  },

  createOffer: async (data: CreateOfferData): Promise<Offer> => {
    const response = await api.post<Offer>('/offers', data);
    return response.data;
  },

  updateOffer: async (id: number, data: UpdateOfferData): Promise<Offer> => {
    const response = await api.put<Offer>(`/offers/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: OfferStatus): Promise<Offer> => {
    const response = await api.patch<Offer>(`/offers/${id}/status`, { status });
    return response.data;
  },

  sendOffer: async (id: number): Promise<Offer> => {
    const response = await api.post<Offer>(`/offers/${id}/send`);
    return response.data;
  },

  deleteOffer: async (id: number): Promise<void> => {
    await api.delete(`/offers/${id}`);
  },
};

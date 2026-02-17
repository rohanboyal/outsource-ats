// src/api/stats.ts - Complete Stats API
import api from './axios';

export interface OverviewStats {
  total_clients: number;
  active_clients: number;
  total_candidates: number;
  candidates_this_month: number;
  active_jds: number;
  total_jds: number;
  active_applications: number;
  total_applications: number;
  interviews_today: number;
  interviews_this_week: number;
  pending_offers: number;
  accepted_offers: number;
  upcoming_joinings: number;
  joinings_this_month: number;
}

export interface PipelineStats {
  sourced: number;
  screened: number;
  submitted: number;
  interviewing: number;
  offered: number;
  joined: number;
  rejected: number;
  withdrawn: number;
}

export interface MonthlyTrend {
  month: string;
  applications: number;
  interviews: number;
  offers: number;
  joinings: number;
}

export interface ClientPerformance {
  client_id: number;
  client_name: string;
  active_jds: number;
  total_applications: number;
  offers_made: number;
  positions_filled: number;
  success_rate: number;
}

export interface Alert {
  type: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
}

export interface RecentActivity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  related_id: number;
}

export const statsApi = {
  getOverview: async (): Promise<OverviewStats> => {
    const response = await api.get<OverviewStats>('/stats/overview');
    return response.data;
  },

  getPipeline: async (): Promise<PipelineStats> => {
    const response = await api.get<PipelineStats>('/stats/pipeline');
    return response.data;
  },

  getMonthlyTrends: async (months: number = 6): Promise<MonthlyTrend[]> => {
    const response = await api.get<MonthlyTrend[]>('/stats/trends/monthly', {
      params: { months },
    });
    return response.data;
  },

  getClientPerformance: async (limit: number = 10): Promise<ClientPerformance[]> => {
    const response = await api.get<ClientPerformance[]>('/stats/clients/performance', {
      params: { limit },
    });
    return response.data;
  },

  getAlerts: async (): Promise<Alert[]> => {
    const response = await api.get<Alert[]>('/stats/alerts');
    return response.data;
  },

  getRecentActivity: async (limit: number = 10): Promise<RecentActivity[]> => {
    const response = await api.get<RecentActivity[]>('/stats/recent-activity', {
      params: { limit },
    });
    return response.data;
  },
};

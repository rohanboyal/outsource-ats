// src/pages/joinings/JoiningsListPage.tsx - FIXED
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, UserCheck, Filter } from 'lucide-react';
import { joiningsApi } from '../../api/joinings';
import { Button } from '../../components/ui/Button';
import type { JoiningStatus } from '../../types';

export function JoiningsListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['joinings', { status: status === 'all' ? undefined : status }],
    queryFn: () => joiningsApi.getJoinings({
      page: 1,
      page_size: 100,
      status: status === 'all' ? undefined : status,
    }),
  });

  // ✅ FIXED: Only 4 statuses that exist in database
  const statusColors: Record<JoiningStatus, string> = {
    confirmed: 'bg-blue-100 text-blue-800',
    no_show: 'bg-red-100 text-red-800',
    delayed: 'bg-yellow-100 text-yellow-800',
    replacement_required: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Joinings</h1>
          <p className="text-muted-foreground mt-1">Track candidate onboarding</p>
        </div>
        <Button onClick={() => navigate('/joinings/new')}>
          <Plus className="h-4 w-4 mr-2" />New Joining
        </Button>
      </div>

      <div className="relative w-48">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="no_show">No Show</option>
          <option value="delayed">Delayed</option>
          <option value="replacement_required">Replacement Required</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {!isLoading && data?.joinings?.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No joinings found</h3>
          <Button onClick={() => navigate('/joinings/new')}>
            <Plus className="h-4 w-4 mr-2" />New Joining
          </Button>
        </div>
      )}

      {!isLoading && data && data.joinings.length > 0 && (
        <div className="space-y-4">
          {data.joinings.map((joining) => (
            <div
              key={joining.id}
              onClick={() => navigate(`/joinings/${joining.id}`)}
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all bg-card"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Joining #{joining.id}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Application #{joining.application_id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expected: {new Date(joining.expected_joining_date).toLocaleDateString()}
                  </p>
                  {joining.actual_joining_date && (
                    <p className="text-sm text-muted-foreground">
                      Actual: {new Date(joining.actual_joining_date).toLocaleDateString()}
                    </p>
                  )}
                  {joining.employee_id && (
                    <p className="text-sm font-medium mt-1">
                      Employee ID: {joining.employee_id}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[joining.status]}`}>
                  {joining.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
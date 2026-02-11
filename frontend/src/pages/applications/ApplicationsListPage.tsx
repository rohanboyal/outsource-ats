// src/pages/applications/ApplicationsListPage.tsx - FIXED
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List } from 'lucide-react';

import { applicationsApi } from '../../api/applications';
import { Button } from '../../components/ui/Button';
import type { ApplicationStatus, Application } from '../../types';

const statusColumns: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: 'sourced', label: 'Sourced', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { status: 'screened', label: 'Screened', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { status: 'submitted', label: 'Submitted', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { status: 'interviewing', label: 'Interviewing', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { status: 'offered', label: 'Offered', color: 'bg-green-100 text-green-800 border-green-200' },
  { status: 'joined', label: 'Joined', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
];

export function ApplicationsListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Fetch all applications
  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications({ page_size: 100 }),
  });

  // Group applications by status - FIXED TYPE
  const groupedApplications = statusColumns.reduce((acc, column) => {
    acc[column.status] = data?.applications?.filter(app => app.status === column.status) || [];
    return acc;
  }, {} as Record<ApplicationStatus, Application[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Track candidate applications through the recruitment pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => navigate('/applications/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Kanban View */}
      {!isLoading && viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statusColumns.map((column) => (
            <div key={column.status} className="flex flex-col">
              {/* Column Header */}
              <div className={`rounded-t-lg border-2 ${column.color} p-3`}>
                <h3 className="font-semibold text-sm">
                  {column.label}
                </h3>
                <p className="text-xs mt-1">
                  {groupedApplications[column.status]?.length || 0} applications
                </p>
              </div>

              {/* Column Cards */}
              <div className="flex-1 border-l-2 border-r-2 border-b-2 rounded-b-lg p-2 space-y-2 min-h-[200px] bg-muted/20">
                {groupedApplications[column.status]?.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="bg-card rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-medium text-sm mb-1">
                      Application #{app.id}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Candidate: {app.candidate_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JD: {app.jd_id}
                    </p>
                    {app.internal_rating && (
                      <div className="mt-2 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < app.internal_rating! ? 'text-yellow-500' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === 'list' && (
        <div className="space-y-2">
          {data?.applications?.map((app) => (
            <div
              key={app.id}
              onClick={() => navigate(`/applications/${app.id}`)}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Application #{app.id}</h3>
                  <p className="text-sm text-muted-foreground">
                    Candidate {app.candidate_id} → JD {app.jd_id}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusColumns.find(s => s.status === app.status)?.color
                  }`}
                >
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!data?.applications || data.applications.length === 0) && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
          <p className="text-muted-foreground mb-4">
            Start by creating your first application
          </p>
          <Button onClick={() => navigate('/applications/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      )}
    </div>
  );
}
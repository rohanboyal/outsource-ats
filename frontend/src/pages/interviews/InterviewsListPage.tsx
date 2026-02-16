// src/pages/interviews/InterviewsListPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar as CalendarIcon, List, Video, Phone, Users, Search, Filter } from 'lucide-react';

import { interviewsApi } from '../../api/interviews';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function InterviewsListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch interviews
  const { data, isLoading } = useQuery({
    queryKey: ['interviews', { page, status: status === 'all' ? undefined : status }],
    queryFn: () => interviewsApi.getInterviews({
      page,
      page_size: 20,
      status: status === 'all' ? undefined : status,
    }),
  });

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-orange-100 text-orange-800',
    rescheduled: 'bg-purple-100 text-purple-800',
  };

  const resultColors = {
    pending: 'bg-gray-100 text-gray-800',
    selected: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
  };

  const modeIcons = {
    video: Video,
    phone: Phone,
    in_person: Users,
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interviews</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage candidate interviews
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => navigate('/interviews/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        {/* Status Filter */}
        <div className="relative w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (data?.interviews?.length ?? 0) === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No interviews scheduled</h3>
          <p className="text-muted-foreground mb-4">
            Schedule your first interview to start the process
          </p>
          <Button onClick={() => navigate('/interviews/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === 'list' && data && data.interviews.length > 0 && (
        <>
          <div className="space-y-4">
            {data.interviews.map((interview) => {
              const ModeIcon = modeIcons[interview.interview_mode] ?? Users;
              
              return (
                <div
                  key={interview.id}
                  onClick={() => navigate(`/interviews/${interview.id}`)}
                  className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ModeIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{interview.round_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Round {interview.round_number} • Application #{interview.application_id}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Scheduled</p>
                          <p className="font-medium">{formatDateTime(interview.scheduled_date)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{interview.duration_minutes} minutes</p>
                        </div>
                        {interview.interviewer_name && (
                          <div>
                            <p className="text-muted-foreground">Interviewer</p>
                            <p className="font-medium">{interview.interviewer_name}</p>
                          </div>
                        )}
                        {interview.rating !== null && interview.rating !== undefined && (
                          <div>
                            <p className="text-muted-foreground">Rating</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-sm ${
                                    i < interview.rating! ? 'text-yellow-500' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[interview.status]}`}>
                        {interview.status}
                      </span>
                      {interview.result && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${resultColors[interview.result]}`}>
                          {interview.result}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} interviews
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Calendar View - Placeholder */}
      {!isLoading && viewMode === 'calendar' && data && data.interviews.length > 0 && (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Calendar View Coming Soon</h3>
          <p className="text-muted-foreground">
            We're working on an interactive calendar view for interviews
          </p>
        </div>
      )}
    </div>
  );
}

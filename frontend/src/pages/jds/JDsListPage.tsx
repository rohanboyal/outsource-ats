// src/pages/jds/JDsListPage.tsx - CORRECTED FOR YOUR BACKEND
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, MapPin, Briefcase, DollarSign, Filter, Building2 } from 'lucide-react';

import { jdsApi } from '../../api/jds';
import { clientsApi } from '../../api/clients';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../lib/utils';

export function JDsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch JDs
  const { data, isLoading } = useQuery({
    queryKey: ['jds', { page, search, status: status === 'all' ? undefined : status, priority: priority === 'all' ? undefined : priority }],
    queryFn: () => jdsApi.getJDs({
      page,
      page_size: 20,
      search: search || undefined,
      status: status === 'all' ? undefined : status,
      priority: priority === 'all' ? undefined : priority,
    }),
  });

  // Fetch clients for display
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients({ page_size: 100 }),
  });

  const getClientName = (clientId: number) => {
    return clientsData?.clients.find(c => c.id === clientId)?.company_name || `Client #${clientId}`;
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    open: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-red-100 text-red-800',
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Descriptions</h1>
          <p className="text-muted-foreground mt-1">
            Manage job requirements and openings
          </p>
        </div>
        <Button onClick={() => navigate('/jds/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Job Description
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search job titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="on_hold">On Hold</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
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
      {!isLoading && data?.job_descriptions.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No job descriptions found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first job description to start recruiting
          </p>
          <Button onClick={() => navigate('/jds/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Job Description
          </Button>
        </div>
      )}

      {/* JDs Grid */}
      {!isLoading && data && data.job_descriptions.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.job_descriptions.map((jd) => (
              <div
                key={jd.id}
                onClick={() => navigate(`/jds/${jd.id}`)}
                className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {/* Status & Priority Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[jd.status]}`}>
                    {jd.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[jd.priority]}`}>
                    {jd.priority}
                  </span>
                </div>

                {/* Job Icon */}
                <div className="mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                </div>

                {/* Job Title */}
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors pr-20">
                  {jd.title}
                </h3>

                {/* JD Code */}
                <div className="text-xs text-muted-foreground mb-2">
                  {jd.jd_code}
                </div>

                {/* Client */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Building2 className="h-4 w-4" />
                  <span>{getClientName(jd.client_id)}</span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {jd.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{jd.location}</span>
                      {jd.work_mode && (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted">
                          {jd.work_mode}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {jd.experience_min !== null && jd.experience_max !== null && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>{jd.experience_min}-{jd.experience_max} years</span>
                    </div>
                  )}

                  {jd.budget_min && jd.budget_max && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {formatCurrency(jd.budget_min, jd.currency || 'USD')} - {formatCurrency(jd.budget_max, jd.currency || 'USD')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {jd.required_skills && jd.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {jd.required_skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                      >
                        {skill}
                      </span>
                    ))}
                    {jd.required_skills.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        +{jd.required_skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{jd.open_positions} position{jd.open_positions !== 1 ? 's' : ''}</span>
                  {jd.sla_days && <span>SLA: {jd.sla_days} days</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} job descriptions
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
    </div>
  );
}
